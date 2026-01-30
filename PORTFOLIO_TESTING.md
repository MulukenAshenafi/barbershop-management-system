# BSBS Portfolio Testing Checklist

## Setup

1. **Backend**
   - `docker-compose up -d`
   - `docker-compose exec backend python manage.py migrate`
   - Seed data (if script exists):  
     `docker-compose exec backend python manage.py shell < scripts/seed_data.py`

2. **Frontend**
   - `cd client && npm install && npm start`
   - Run on device/simulator (Expo Go or dev client)

---

## Core Flows to Test

### Flow 1: Customer Journey

- [ ] Register new account (Customer)
- [ ] Browse shops with location permission
- [ ] View shop public profile with reviews
- [ ] Book service with specific barber
- [ ] Complete payment flow
- [ ] Check My Appointments shows booking
- [ ] Leave review after appointment
- [ ] Verify review appears in shop profile

### Flow 2: Owner Journey

- [ ] Register as Barbershop Owner
- [ ] Create barbershop with logo/hours
- [ ] Invite barber via email
- [ ] Add services and products
- [ ] View analytics dashboard
- [ ] Manage staff (verify barber appears)

### Flow 3: Dark Mode

- [ ] Toggle Light/Dark in Account → Appearance
- [ ] All screens adapt (no black text on dark background)
- [ ] Images still visible (proper contrast)
- [ ] Restart app; theme persists

### Flow 4: Toast & Feedback

- [ ] Login error → Toast (no Alert)
- [ ] Register success → Toast then navigate
- [ ] Booking created → Toast then navigate
- [ ] Order placed → Toast
- [ ] Profile updated → Toast
- [ ] Review posted → Toast

### Flow 5: Edge Cases

- [ ] Book same slot twice → 409 handling (toast: "This slot was just booked...")
- [ ] Submit review twice → duplicate prevention (toast)
- [ ] 401 (token expiry) → redirects to login
- [ ] Network error → toast or retry UI

---

## Demo Recording Tips

- Use iPhone simulator with **Slow Animations** OFF
- Record in Light mode first, then toggle to Dark mode
- Show Toast notifications clearly (no Alert dialogs for feedback)
- Demonstrate skeleton → content transition on list screens
- Show map interaction in Explore Shops
- Show Appearance toggle in Account

---

## Acceptance Criteria

| Criterion | Check |
|-----------|--------|
| No `Alert.alert()` for user feedback (except system permissions) | |
| All feedback uses Toast | |
| Dark mode works on every screen | |
| Images load with fade-in (OptimizedImage) | |
| Forms handle keyboard (KeyboardAvoidingView) | |
| Testing checklist exists and is executable | |
