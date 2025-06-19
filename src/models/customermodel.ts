// models/customermodel.ts - FIXED WITH PROPER TYPESCRIPT INTERFACES
import mongoose, { Document, Model } from 'mongoose';

// Define the Customer document interface
export interface ICustomer extends Document {
  name: string;
  phoneNumber: string;
  email: string;
  loyaltyPoints: number;
  isMembership: boolean;
  membershipBarcode?: string;
  membershipPurchaseDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  getServicePricing(serviceIds: string[]): Promise<any[]>;
  toggleMembership(status?: boolean): Promise<ICustomer>;
  generateMembershipBarcode(): string;
}

// Define the Customer model interface with static methods
export interface ICustomerModel extends Model<ICustomer> {
  findByBarcode(barcode: string): Promise<ICustomer | null>;
}

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, index: true },
  
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // === MEMBERSHIP WITH BARCODE ===
  isMembership: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // UNIQUE BARCODE FOR MEMBERS
  membershipBarcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  membershipPurchaseDate: {
    type: Date,
    sparse: true
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

}, { timestamps: true });

// Instance method to generate unique barcode when granting membership
customerSchema.methods.generateMembershipBarcode = function(this: ICustomer): string {
  if (!this.membershipBarcode) {
    // Generate format: SALON-YYYYMMDD-XXXX (where XXXX is random)
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.membershipBarcode = `SALON-${date}-${random}`;
  }
  return this.membershipBarcode;
};

// Instance method to get pricing for services based on membership status
customerSchema.methods.getServicePricing = async function(this: ICustomer, serviceIds: string[]) {
  const ServiceItem = mongoose.model('ServiceItem');
  const services = await ServiceItem.find({ _id: { $in: serviceIds } });
  
  return services.map(service => ({
    serviceId: service._id,
    serviceName: service.name,
    originalPrice: service.price,
    finalPrice: this.isMembership && service.membershipRate ? 
      service.membershipRate : service.price,
    membershipDiscount: this.isMembership && service.membershipRate ? 
      (service.price - service.membershipRate) : 0,
    isMembershipApplied: this.isMembership && !!service.membershipRate
  }));
};

// Instance method to toggle membership status
customerSchema.methods.toggleMembership = function(this: ICustomer, status = true): Promise<ICustomer> {
  this.isMembership = status;
  if (status) {
    this.membershipPurchaseDate = new Date();
    this.generateMembershipBarcode();
  } else {
    this.membershipBarcode = undefined;
  }
  return this.save();
};

// Static method to find customer by barcode
customerSchema.statics.findByBarcode = function(this: ICustomerModel, barcode: string): Promise<ICustomer | null> {
  return this.findOne({ 
    membershipBarcode: barcode, 
    isMembership: true, 
    isActive: true 
  });
};

// Create and export the model with proper typing
const Customer = (mongoose.models.Customer as ICustomerModel) || 
  mongoose.model<ICustomer, ICustomerModel>('Customer', customerSchema);

export default Customer;