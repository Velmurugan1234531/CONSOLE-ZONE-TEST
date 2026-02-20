# Console Zone - Rental Fleet Serial Numbers (Demo)

## 📋 Current Fleet Inventory

Since Supabase is not yet configured, here's a **demo preview** of how your rental fleet serial numbers will be organized once you connect your database.

---

## 🎮 PlayStation 5 Units

| Serial Number | Model Name | Status | Current User | Notes |
|--------------|------------|--------|--------------|-------|
| SN-000001 | PS5 Disc Edition | Ready | - | Pristine condition |
| SN-000002 | PS5 Disc Edition | Rented | John Doe | Due back: Feb 15 |
| SN-000003 | PS5 Digital Edition | Maintenance | - | Controller drift repair |
| SN-000004 | PS5 Disc Edition | Ready | - | - |
| SN-000005 | PS5 Spiderman Edition | Rented | Jane Smith | Premium unit |

---

## 🎮 PlayStation 4 Units

| Serial Number | Model Name | Status | Current User | Notes |
|--------------|------------|--------|--------------|-------|
| SN-000006 | PS4 Pro | Ready | - | 1TB Storage |
| SN-000007 | PS4 Slim | Rented | Mike Johnson | Weekly rental |
| SN-000008 | PS4 Pro | Ready | - | Recently serviced |

---

## 🎮 Xbox Series X Units

| Serial Number | Model Name | Status | Current User | Notes |
|--------------|------------|--------|--------------|-------|
| SN-000009 | Xbox Series X | Ready | - | Game Pass included |
| SN-000010 | Xbox Series X | Under-Repair | - | HDMI port issue |

---

## 🔧 How It Works (Once Configured)

### 1. **Automatic Serial Generation**
When you add a new console via `/admin/fleet`, the system auto-generates:
- Format: `SN-XXXXXX` (6 digits, zero-padded)
- Unique per device
- Immutable once created

### 2. **Rental Assignment**
When a customer books:
1. Admin assigns a specific unit via "Assign Unit" button
2. Serial number is linked to the rental
3. Customer sees it in their profile: `"PS5 (SN: 000002)"`

### 3. **Status Tracking**
Serial numbers track through the lifecycle:
- **Ready** → Available for rent
- **Rented** → Currently with customer
- **Maintenance** → Post-return inspection
- **Under-Repair** → Service required
- **Lost** → Removed from active fleet

### 4. **Customer View**
In `/profile`, customers see:
```
Active Rental: PlayStation 5
Assigned Unit: PS5 Disc Edition (SN: 000002)
Status: Active
```

---

## 📊 Quick Stats (Demo Data)

- **Total Fleet**: 10 units
- **Available**: 5 units
- **Rented**: 3 units
- **In Service**: 2 units
- **Utilization Rate**: 50%

---

## 🚀 Next Steps

1. **Get Supabase Credentials**:
   - Visit [supabase.com](https://supabase.com)
   - Create project → Get API keys

2. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. **Run Migrations**:
   - Apply database schema from `supabase/migrations/`

4. **Add Real Units**:
   - Go to `http://localhost:3001/admin/fleet`
   - Click "Add Device"
   - Serial numbers auto-generate!

---

## 💡 Pro Tips

- **Barcode Integration**: Serial numbers can be printed as QR codes for easy scanning
- **Audit Trail**: Every status change is logged with timestamp
- **Search**: Use serial number to quickly find any unit in the fleet
- **Reports**: Export serial number lists for insurance/inventory audits

---

*This is a demo preview. Actual serial numbers will populate once Supabase is configured.*
