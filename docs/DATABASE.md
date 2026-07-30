# Car Plus — Database Schema (ER Diagram)

The Supabase/Postgres schema behind the Car Plus site: **5 content tables** plus
Supabase's built-in authentication. The content tables stand alone — the only true
relationship links an admin record back to an auth user.

> **Legend:** `PK` primary key · `FK` foreign key · `UK` unique

```mermaid
erDiagram
    AUTH_USERS ||--o| ADMIN_USERS : "may be admin"
    AUTH_USERS ||--o{ ORDERS : "places"
    ORDERS ||--|{ ORDER_ITEMS : "contains"

    ORDERS {
        uuid id PK
        uuid user_id FK "nullable (walk-in)"
        text customer_name
        text phone
        text status "pending..completed|cancelled"
        numeric total_amount
        text notes
        timestamptz created_at
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        text car_id "soft link to cars.id"
        text car_name
        numeric price
    }
    AUTH_USERS {
        uuid id PK
        text email
        jsonb user_metadata "full_name"
    }
    ADMIN_USERS {
        uuid id PK
        uuid user_id FK "unique to auth.users"
        timestamptz created_at
    }
    CARS {
        uuid id PK
        text code UK
        text name
        text model
        int4 year
        numeric price
        text status "ready|onroad|luxury|plate"
        int4 viewers
        text image
        text_ARR images
        text body_type
        text tax_status
        text condition
        text fuel_type
        text color
        text_ARR description
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }
    BANNERS {
        uuid id PK
        text image "URL in car-images"
        int4 sort_order
        timestamptz created_at
        timestamptz updated_at
    }
    TEAM_MEMBERS {
        uuid id PK
        text name
        text role
        text image
        int4 sort_order
        timestamptz created_at
        timestamptz updated_at
    }
    CONTACT_INFO {
        int4 id PK "always = 1"
        text phone
        text telegram
        text facebook
        text address
        text email
        text map_link
        timestamptz updated_at
    }
```

## Tables at a glance

| Table | Purpose | Notable columns |
|---|---|---|
| **cars** | Vehicle inventory shown on the site | `code` (unique), `price`, `status`, `images[]`, `description[]`, `is_active` |
| **banners** | Rotating hero images (admin-editable) | `image` (URL), `sort_order` |
| **team_members** | "Meet our team" cards | `name`, `role`, `image`, `sort_order` |
| **contact_info** | Site contact details — a single row (`id` = 1) | `phone`, `telegram`, `facebook`, `map_link` |
| **admin_users** | Who has admin access | `user_id` → `auth.users` |
| **auth.users** | Supabase-managed accounts (login) | `email`, `user_metadata` |

## Relationships & rules

- **The one relationship:** `admin_users.user_id → auth.users.id`. It's **unique**, so each
  account maps to at most one admin record — a user either is an admin or isn't. The
  `is_admin()` function reads this table to gate the dashboard.
- **Content tables are independent.** `cars`, `banners`, `team_members`, and `contact_info`
  have no foreign keys between them — each is edited on its own.
- **Photos live in Storage, not the tables.** The `image` / `images` columns store **URLs**
  pointing to the `car-images` storage bucket — a soft link by string, not a database foreign
  key. (This is why deleting the old project broke the photos: the URLs pointed at storage
  that no longer exists.)
- **contact_info is a single row.** Its `id` is always `1` (a CHECK constraint enforces it),
  so the app updates that one row rather than inserting new ones.
- **Row-Level Security.** Anyone can *read* active cars, banners, team, and contact; only
  admins can *write*. The wishlist isn't a table — it's stored in the browser's localStorage.

---

_5 tables · 1 relationship · Supabase Postgres · `car-images` storage bucket._
