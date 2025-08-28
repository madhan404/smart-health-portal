import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Doctor from '../models/Doctor.js'
import Patient from '../models/Patient.js'
import Staff from '../models/Staff.js'
import Appointment from '../models/Appointment.js'
import Prescription from '../models/Prescription.js'
import Bill from '../models/Bill.js'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_appointment'

async function cleanupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB successfully')

    console.log('\n🗑️ Starting database cleanup...')
    console.log('⚠️  This will delete ALL data except user login accounts!')
    
    // Delete all appointments
    console.log('\n📅 Deleting appointments...')
    const appointmentsResult = await Appointment.deleteMany({})
    console.log(`✅ Deleted ${appointmentsResult.deletedCount} appointments`)

    // Delete all prescriptions
    console.log('\n💊 Deleting prescriptions...')
    const prescriptionsResult = await Prescription.deleteMany({})
    console.log(`✅ Deleted ${prescriptionsResult.deletedCount} prescriptions`)

    // Delete all bills
    console.log('\n💰 Deleting bills...')
    const billsResult = await Bill.deleteMany({})
    console.log(`✅ Deleted ${billsResult.deletedCount} bills`)



    // Delete all patients (except default accounts - will be handled later)
    console.log('\n👥 Preparing to delete patients...')

    // Delete all staff members (except the default staff account)
    console.log('\n👨‍💼 Deleting staff members...')
    const staffResult = await Staff.deleteMany({ email: { $ne: 'emily.johnson@clinic.com' } })
    console.log(`✅ Deleted ${staffResult.deletedCount} staff members`)
    console.log('ℹ️  Kept default staff account: emily.johnson@clinic.com')

    // Delete all doctors (except the default doctor account)
    console.log('\n👩‍⚕️ Deleting doctors...')
    const doctorsResult = await Doctor.deleteMany({ email: { $ne: 'sarah.wilson@clinic.com' } })
    console.log(`✅ Deleted ${doctorsResult.deletedCount} doctors`)
    console.log('ℹ️  Kept default doctor account: sarah.wilson@clinic.com')

    // Delete all patients (except the default patient accounts)
    console.log('\n👥 Deleting patients...')
    const patientsResult = await Patient.deleteMany({ 
      email: { 
        $nin: ['john.smith@email.com', 'maria.garcia@email.com'] 
      } 
    })
    console.log(`✅ Deleted ${patientsResult.deletedCount} patients`)
    console.log('ℹ️  Kept default patient accounts: john.smith@email.com, maria.garcia@email.com')

    // Reset doctor availability
    console.log('\n📅 Resetting doctor availability...')
    await Doctor.updateMany(
      { email: 'sarah.wilson@clinic.com' },
      { $unset: { availability: 1 } }
    )
    console.log('✅ Reset doctor availability')

    // Show remaining accounts
    console.log('\n👤 Remaining login accounts:')
    
    const remainingDoctors = await Doctor.find({}, 'email name')
    console.log('👩‍⚕️ Doctors:', remainingDoctors.map(d => `${d.name} (${d.email})`).join(', '))
    
    const remainingStaff = await Staff.find({}, 'email name')
    console.log('👨‍💼 Staff:', remainingStaff.map(s => `${s.name} (${s.email})`).join(', '))
    
    const remainingPatients = await Patient.find({}, 'email name')
    console.log('👥 Patients:', remainingPatients.map(p => `${p.name} (${p.email})`).join(', '))

    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('📋 Summary:')
    console.log(`   • Appointments: ${appointmentsResult.deletedCount} deleted`)
    console.log(`   • Prescriptions: ${prescriptionsResult.deletedCount} deleted`)
    console.log(`   • Bills: ${billsResult.deletedCount} deleted`)
    console.log(`   • Patients: ${patientsResult.deletedCount} deleted`)
    console.log(`   • Staff: ${staffResult.deletedCount} deleted`)
    console.log(`   • Doctors: ${doctorsResult.deletedCount} deleted`)
    console.log('   • Login accounts: Preserved')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the cleanup
cleanupDatabase()
