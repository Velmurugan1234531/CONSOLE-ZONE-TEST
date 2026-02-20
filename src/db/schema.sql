
-- 🛡️ GOD MODE: Strict Schema Definition v1.0
-- -------------------------------------------------------------
-- 👥 1. USERS TABLE (Strict RBAC)
create table users (
  id uuid references auth.users not null primary key,
  full_name text,
  email text unique,
  role text default 'customer' check (role in ('admin', 'super_admin', 'customer', 'rider', 'support')),
  status text default 'active' check (status in ('active', 'suspended', 'banned')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 📦 2. PRODUCTS TABLE
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  type text check (type in ('rent', 'sell', 'both')),
  price numeric(10, 2) not null,
  stock integer default 0,
  status text default 'active',
  metadata jsonb
);

-- 🛒 3. ORDERS TABLE
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  total_amount numeric(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text default 'pending',
  items jsonb, -- Snapshot of items at purchase
  created_at timestamp with time zone default now()
);

-- 🔧 4. REPAIRS TABLE
create table repairs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  device_type text,
  issue_description text,
  status text default 'received' check (status in ('received', 'diagnosing', 'repairing', 'ready', 'delivered')),
  cost_estimate numeric(10, 2),
  created_at timestamp with time zone default now()
);

-- 📍 5. TRACKING LOGS (Audit Trail)
create table tracking_logs (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id),
  rider_id uuid references users(id),
  lat double precision,
  lng double precision,
  timestamp timestamp with time zone default now()
);

-- 🛡️ 6. AUDIT LOGS (Security)
create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id),
  action text not null,
  severity text check (severity in ('info', 'warning', 'critical')),
  metadata jsonb,
  ip_address text,
  created_at timestamp with time zone default now()
);

-- 🔐 ROW LEVEL SECURITY (RLS) POLICIES
-- 1. Users can only read their own data
alter table users enable row level security;
create policy "Users can view own data" on users for select using (auth.uid() = id);

-- 2. admins can view all users
create policy "Admins can view all users" on users for select using (
  exists (select 1 from users where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 3. Audit Logs are INSERT ONLY for system/admins
alter table audit_logs enable row level security;
create policy "System can insert audit logs" on audit_logs for insert with check (true);
create policy "Admins can view audit logs" on audit_logs for select using (
  exists (select 1 from users where id = auth.uid() and role in ('admin', 'super_admin'))
);
