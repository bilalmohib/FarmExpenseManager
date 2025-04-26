import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  customerName: string;
  companyName: string;
  streetAddress: string;
  city: string;
  phone: string;
  items: InvoiceItem[];
  discountThreshold: string;
  discountPercentage: string;
  additionalDiscount: string;
  taxRate: string;
  notes: string;
}

export default function NewInvoiceScreen(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: '1111', // Example initial value
    date: new Date(),
    customerName: '',
    companyName: '',
    streetAddress: '',
    city: '',
    phone: '',
    items: [{ id: Date.now().toString(), description: '', quantity: '1', unitPrice: '' }],
    discountThreshold: '1000000',
    discountPercentage: '10',
    additionalDiscount: '5',
    taxRate: '0',
    notes: 'Make all checks payable to Unique Cattle Farm. If you have any questions concerning this invoice please contact us at Uniquecattlefarmpk@gmail.com or +92 312 7811868 , +92 302 3777494'
  });

  // --- Item Management --- 
  const handleAddItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', quantity: '1', unitPrice: '' }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // --- Calculations --- 
  const calculateItemAmount = (item: InvoiceItem): number => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const calculateSubtotal = (): number => {
    return invoiceData.items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };

  const calculateDiscountAmount = (itemAmount: number): number => {
    const threshold = parseFloat(invoiceData.discountThreshold) || 0;
    const percentage = parseFloat(invoiceData.discountPercentage) || 0;
    if (threshold > 0 && itemAmount >= threshold && percentage > 0) {
      return itemAmount * (percentage / 100);
    }
    return 0;
  };

  const calculateTotalAmountAfterItemDiscount = (): number => {
    return invoiceData.items.reduce((sum, item) => {
        const itemAmount = calculateItemAmount(item);
        const discount = calculateDiscountAmount(itemAmount);
        return sum + (itemAmount - discount);
    }, 0);
  };

  const calculateAdditionalDiscount = (amount: number): number => {
    const percentage = parseFloat(invoiceData.additionalDiscount) || 0;
    return percentage > 0 ? amount * (percentage / 100) : 0;
  };

  const calculateTax = (amount: number): number => {
    const rate = parseFloat(invoiceData.taxRate) || 0;
    return rate > 0 ? amount * (rate / 100) : 0;
  };

  const calculateBalanceDue = (): number => {
    const subtotalAfterItemDiscount = calculateTotalAmountAfterItemDiscount();
    const additionalDiscountAmount = calculateAdditionalDiscount(subtotalAfterItemDiscount);
    const amountBeforeTax = subtotalAfterItemDiscount - additionalDiscountAmount;
    const taxAmount = calculateTax(amountBeforeTax);
    return amountBeforeTax + taxAmount; // Assuming Credit is 0 for now
  };

  const formatCurrency = (amount: number): string => {
    // Basic formatting, consider a library for more robust formatting
    return `Rs${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // --- PDF Generation --- 
  const generateHTML = async (data: InvoiceData): Promise<string> => {
    
    // Load the logo image and convert to base64
    let logoBase64 = '';
    try {
      const logoAsset = Asset.fromModule(require('../../assets/images/icon.png')); // Adjust path if needed
      await logoAsset.downloadAsync();
      if (logoAsset.localUri) {
        logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch (error) {
      console.error("Error loading logo:", error);
      // Optionally set a default placeholder or handle the error
    }

    const formattedDate = data.date.toLocaleDateString();
    const subtotal = calculateSubtotal();
    const subtotalAfterItemDiscount = calculateTotalAmountAfterItemDiscount();
    const additionalDiscountAmount = calculateAdditionalDiscount(subtotalAfterItemDiscount);
    const amountBeforeTax = subtotalAfterItemDiscount - additionalDiscountAmount;
    const taxAmount = calculateTax(amountBeforeTax);
    const balanceDue = calculateBalanceDue();

    const itemsHTML = data.items.map(item => {
      const itemAmount = calculateItemAmount(item);
      const discount = calculateDiscountAmount(itemAmount);
      const displayAmount = itemAmount - discount;
      const discountAppliedText = discount > 0 ? `Discount applied (${data.discountPercentage}%)` : '';
      return `
        <tr>
          <td class="center">${item.quantity}</td>
          <td>${item.description}</td>
          <td class="right">${formatCurrency(parseFloat(item.unitPrice) || 0)}</td>
          <td class="right">${formatCurrency(displayAmount)}</td>
          <td class="center">${discountAppliedText}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
          body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; font-size: 12px; line-height: 1.6em; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); background-color: #fff; }
          .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .farm-details { width: 50%; }
          .farm-logo { max-width: 100px; max-height: 100px; margin-bottom: 10px; }
          .invoice-details { width: 40%; text-align: right; }
          .invoice-details strong { display: inline-block; width: 80px; }
          .bill-to-section { margin-bottom: 40px; }
          .bill-to-section strong { display: block; margin-bottom: 5px; }
          .items-table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-bottom: 40px; }
          .items-table th { background: #333; color: #fff; font-weight: bold; padding: 8px; border: 1px solid #333; }
          .items-table td { padding: 8px; border: 1px solid #eee; }
          .items-table tr:nth-child(even) { background: #f9f9f9; }
          .totals-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 30px; }
          .notes-section { width: 60%; }
          .summary-section { width: 35%; }
          .summary-table { width: 100%; }
          .summary-table td { padding: 5px 0; }
          .summary-table .label { text-align: right; padding-right: 10px; font-weight: bold; }
          .summary-table .value { text-align: right; }
          .summary-table .balance-due td { font-weight: bold; font-size: 14px; border-top: 2px solid #eee; padding-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
          .right { text-align: right; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .discount-info { font-style: italic; color: #777; font-size: 11px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header-section">
            <div class="farm-details">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="farm-logo" />` : '<div style="width: 80px; height: 80px; background-color: #eee; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #aaa;">No Logo</div>'}
              <div class="bold">Unique Cattle Farm</div>
              <div>Qadir Pur, Near Govt. Higher Secondary School,</div>
              <div>Fateh Pur Kamal Tehsil Khan Pur,</div>
              <div>District Rahim Yar Khan (RYK), Pakistan</div>
              <div>Phone: +92 312 7811868 , +92 302 3777494</div>
              <div>Email: Uniquecattlefarmpk@gmail.com</div>
            </div>
            <div class="invoice-details">
              <h1 style="color: #4CAF50; margin: 0 0 20px 0;">INVOICE</h1>
              <div><strong>Date:</strong> ${formattedDate}</div>
              <div><strong>Invoice #:</strong> ${data.invoiceNumber}</div>
            </div>
          </div>

          <div class="bill-to-section">
            <div style="background-color: #333; color: #fff; padding: 10px; font-weight: bold; margin-bottom: 10px;">Bill To:</div>
            <div><strong>Customer Name:</strong> ${data.customerName}</div>
            <div><strong>Company Name:</strong> ${data.companyName}</div>
            <div><strong>Street Address:</strong> ${data.streetAddress}</div>
            <div><strong>City:</strong> ${data.city}</div>
            <div><strong>Phone:</strong> ${data.phone}</div>
          </div>

          <div class="discount-info">
            Items over ${formatCurrency(parseFloat(data.discountThreshold))} qualify for an additional ${data.discountPercentage}% discount.
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="center">Quantity</th>
                <th>Description</th>
                <th class="right">Unit Price</th>
                <th class="right">Amount</th>
                <th class="center">Discount Applied</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="notes-section" style="background-color: #FFF8E1; padding: 15px; border-radius: 4px;">
              <div style="font-weight: bold; margin-bottom: 5px;">Make all checks payable to Unique Cattle Farm.</div>
              <div>If you have any questions concerning this invoice please contact us at</div>
              <div>Uniquecattlefarmpk@gmail.com or +92 312 7811868 , +92 302 3777494</div>
              <div style="font-weight: bold; margin-top: 15px;">Thank you for your business!</div>
            </div>
            <div class="summary-section">
              <table class="summary-table">
                <tr>
                  <td class="label">Subtotal</td>
                  <td class="value">${formatCurrency(subtotalAfterItemDiscount)}</td>
                </tr>
                <tr>
                  <td class="label">Credit</td>
                  <td class="value">${formatCurrency(0)}</td>
                </tr>
                <tr>
                  <td class="label">Tax (${data.taxRate}%)</td>
                  <td class="value">${formatCurrency(taxAmount)}</td>
                </tr>
                <tr>
                  <td class="label">Additional Discount (${data.additionalDiscount}%)</td>
                  <td class="value">(${formatCurrency(additionalDiscountAmount)})</td>
                </tr>
                <tr class="balance-due">
                  <td class="label">Balance Due</td>
                  <td class="value" style="color: #D32F2F;">${formatCurrency(balanceDue)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="footer">
            Unique Cattle Farm Invoice System
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleGeneratePdf = async () => {
    setLoading(true);
    try {
      const htmlContent = await generateHTML(invoiceData);
      const options = {
        html: htmlContent,
        fileName: `Invoice_${invoiceData.invoiceNumber}_${invoiceData.customerName.replace(/\s+/g, '')}`,
        directory: 'Documents', // Standard directory, might need adjustment based on platform/permissions
        base64: true,
      };

      const file = await RNHTMLtoPDF.default.convert(options);
      console.log('PDF Generated: ', file.filePath);

      // Use react-native-share to share the PDF
      const shareOptions = {
        title: 'Share Invoice PDF',
        message: `Invoice ${invoiceData.invoiceNumber} for ${invoiceData.customerName}`,
        url: `file://${file.filePath}`, // Use file path for sharing
        type: 'application/pdf',
        failOnCancel: false,
      };

      await Share.open(shareOptions);
      Alert.alert('Success', 'PDF generated and ready to share.');

    } catch (error: any) {
      console.error('Error generating or sharing PDF:', error);
      Alert.alert('Error', `Failed to generate or share PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Create New Invoice</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Invoice Header Info */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Invoice #</Text>
                <TextInput
                  style={styles.input}
                  value={invoiceData.invoiceNumber}
                  onChangeText={(text) => setInvoiceData(prev => ({ ...prev, invoiceNumber: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>{invoiceData.date.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={invoiceData.date}
                    mode="date"
                    display="default"
                    onChange={(event, date?: Date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setInvoiceData(prev => ({ ...prev, date: date }));
                      }
                    }}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Bill To Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bill To</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={styles.input}
                value={invoiceData.customerName}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, customerName: text }))}
                placeholder="Enter customer name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                value={invoiceData.companyName}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, companyName: text }))}
                placeholder="Enter company name (optional)"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={invoiceData.streetAddress}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, streetAddress: text }))}
                placeholder="Enter street address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={invoiceData.city}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, city: text }))}
                placeholder="Enter city"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={invoiceData.phone}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Items</Text>
            {/* Item Header */}
            <View style={styles.itemRowHeader}>
              <Text style={[styles.itemCol, styles.itemColQty, styles.itemHeaderText]}>Qty</Text>
              <Text style={[styles.itemCol, styles.itemColDesc, styles.itemHeaderText]}>Description</Text>
              <Text style={[styles.itemCol, styles.itemColPrice, styles.itemHeaderText]}>Unit Price</Text>
              <Text style={[styles.itemCol, styles.itemColAmount, styles.itemHeaderText]}>Amount</Text>
              <View style={[styles.itemCol, styles.itemColAction]} />{/* Action column placeholder*/}
            </View>

            {invoiceData.items.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.itemInput, styles.itemColQty]}
                  value={item.quantity}
                  onChangeText={(text) => handleItemChange(item.id, 'quantity', text)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.itemInput, styles.itemColDesc]}
                  value={item.description}
                  onChangeText={(text) => handleItemChange(item.id, 'description', text)}
                  placeholder="Item description"
                />
                <TextInput
                  style={[styles.input, styles.itemInput, styles.itemColPrice]}
                  value={item.unitPrice}
                  onChangeText={(text) => handleItemChange(item.id, 'unitPrice', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
                <Text style={[styles.itemCol, styles.itemColAmount, styles.itemAmountText]}>
                  {formatCurrency(calculateItemAmount(item))}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleRemoveItem(item.id)}
                  style={[styles.itemCol, styles.itemColAction]} 
                  disabled={invoiceData.items.length <= 1}
                >
                  <Ionicons name="trash-outline" size={20} color={invoiceData.items.length > 1 ? Colors.light.error : '#ccc'} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Ionicons name="add" size={18} color={Colors.light.tint} />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Discount Info Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Discounts</Text>
            <Text style={styles.discountInfoText}>Items over a certain amount qualify for an additional discount.</Text>
            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Discount Threshold (Rs)</Text>
                <TextInput
                  style={styles.input}
                  value={invoiceData.discountThreshold}
                  onChangeText={(text) => setInvoiceData(prev => ({ ...prev, discountThreshold: text }))}
                  placeholder="e.g., 1000000"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Item Discount (%)</Text>
                <TextInput
                  style={styles.input}
                  value={invoiceData.discountPercentage}
                  onChangeText={(text) => setInvoiceData(prev => ({ ...prev, discountPercentage: text }))}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Totals Section */}
          <View style={styles.card}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(calculateTotalAmountAfterItemDiscount())}</Text>
            </View>
            {/* <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Credit</Text>
              <Text style={styles.totalsValue}>{formatCurrency(0)}</Text> // Placeholder 
            </View> */}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Additional Discount (%)</Text>
              <TextInput
                style={[styles.input, styles.totalsInput]}
                value={invoiceData.additionalDiscount}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, additionalDiscount: text }))}
                placeholder="e.g., 5"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax Rate (%)</Text>
              <TextInput
                style={[styles.input, styles.totalsInput]}
                value={invoiceData.taxRate}
                onChangeText={(text) => setInvoiceData(prev => ({ ...prev, taxRate: text }))}
                placeholder="e.g., 0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.totalsRow, styles.balanceDueRow]}>
              <Text style={styles.balanceDueLabel}>Balance Due</Text>
              <Text style={styles.balanceDueValue}>{formatCurrency(calculateBalanceDue())}</Text>
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.card}>
            <Text style={styles.label}>Notes / Payment Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={invoiceData.notes}
              onChangeText={(text) => setInvoiceData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Enter notes or payment instructions"
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleGeneratePdf}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.generateButtonText}>Generate Invoice PDF</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: Colors.light.background },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputGroupHalf: {
    width: '48%',
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 40,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  itemRowHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCol: {
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  itemColQty: { width: '15%', textAlign: 'center' },
  itemColDesc: { flex: 1 },
  itemColPrice: { width: '22%', textAlign: 'right' },
  itemColAmount: { width: '25%', textAlign: 'right' },
  itemColAction: { width: '10%', alignItems: 'center', justifyContent: 'center' },
  itemInput: {
    paddingVertical: 8,
    height: 38,
  },
  itemAmountText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 6,
  },
  addItemButtonText: {
    color: Colors.light.tint,
    marginLeft: 5,
    fontWeight: '500',
  },
  discountInfoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  totalsLabel: {
    fontSize: 14,
    color: '#555',
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalsInput: {
    width: '30%',
    textAlign: 'right',
    paddingVertical: 5,
    height: 35,
  },
  balanceDueRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  balanceDueLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceDueValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.error,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 