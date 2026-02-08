🏆 Gold Loan Management Dashboard

A web-based dashboard system for managing a Gold Loan Shop, where customers pledge gold and receive money in return. The system tracks gold details, loan amounts, monthly interest, payments, and loan completion using MongoDB.

⸻

📌 Project Overview

This system allows:
	•	Customers to pledge gold and receive loan amount.
	•	Monthly interest calculation (2% per month).
	•	Tracking partial payments.
	•	Managing multiple gold items per user.
	•	Categorizing gold items.
	•	Automatic interest increment from the next month.
	•	Moving completed 1-year loans to a separate collection.
	•	Dashboard view for active, completed, and interest-paying customers.

⸻

🛠️ Tech Stack
	•	Backend: Node.js / Express (or your preferred backend)
	•	Database: MongoDB
	•	Database Name: gold
	•	Frontend: Dashboard UI (React / EJS / etc.)

⸻

🗄️ Database Structure

📁 Database Name: gold

1️⃣ users Collection

Stores customer details.

{
  "_id": ObjectId,
  "name": "John",
  "phone": "9876543210",
  "address": "Chennai",
  "createdAt": Date
}


⸻

2️⃣ golddetails Collection

Stores gold item details pledged by users.

{
  "_id": ObjectId,
  "goldId": "GOLD001",
  "userId": ObjectId,
  "category": "Necklace",
  "goldType": "22K",
  "weight": 15, 
  "date": "2026-01-20",
  "createdAt": Date
}

✅ One user can have multiple gold entries.

⸻

3️⃣ loan Collection

Stores loan and financial details.

{
  "_id": ObjectId,
  "loanId": "LOAN001",
  "userId": ObjectId,
  "goldId": ObjectId,
  "principalAmount": 5000,
  "interestRate": 2,
  "startDate": "2026-01-20",
  "currentInterest": 0,
  "totalAmount": 5000,
  "amountPaid": 0,
  "status": "active", 
  "lastInterestUpdated": "2026-01-20"
}


⸻

4️⃣ completedLoans Collection

Stores loans completed after full repayment or after 1 year.

{
  "_id": ObjectId,
  "loanId": "LOAN001",
  "userId": ObjectId,
  "goldId": ObjectId,
  "principalAmount": 5000,
  "totalPaid": 5400,
  "completedDate": "2027-01-21",
  "durationMonths": 12
}


⸻

💰 Interest Calculation Logic

📌 Rule:
	•	Interest = 2% per month
	•	If gold is pledged on Jan 20
	•	On Feb 1, interest should be applied
	•	Interest increases every new month

🧮 Formula:

Monthly Interest = (Principal Amount × 2%) 

Example:

Principal = ₹5000
Interest per month = 5000 × 0.02 = ₹100

After 1 month:
Total = 5100

After 2 months:
Total = 5200

⸻

🔁 Monthly Interest Update Logic
	•	On the 1st of every month:
	•	Check all active loans
	•	If month changed since lastInterestUpdated
	•	Add 2% interest
	•	Update:
	•	currentInterest
	•	totalAmount
	•	lastInterestUpdated

⸻

💳 Partial Payment Handling

If customer pays partial amount:

Example:
	•	Total = ₹5200
	•	Customer pays ₹200

Update:

{
  "amountPaid": 200,
  "totalAmount": 5000
}

Interest for next month should calculate on:

Remaining Principal


⸻

✅ Loan Completion Logic

If:

amountPaid >= totalAmount

Then:
	•	Change status to "completed"
	•	Move record to completedLoans
	•	Remove from loan collection (optional)

⸻

📆 One Year Condition

If:

Loan Duration >= 12 months

Then:
	•	Automatically move to completedLoans
	•	Mark as expired or completed

⸻

📊 Dashboard Features

Active Loans
	•	User Name
	•	Gold Category
	•	Principal
	•	Current Interest
	•	Total Payable
	•	Months Completed

Interest Paying Customers
	•	Users who paid only interest
	•	Users who partially paid

Completed Loans
	•	Fully repaid
	•	1-year expired loans

Search & Filter
	•	By user
	•	By category
	•	By date
	•	By status

⸻

🔍 Sample Scenario

Customer:
	•	Name: Ravi
	•	Date: Jan 20
	•	Loan: ₹5000

Feb 1:
	•	Interest = ₹100
	•	Total = ₹5100

Mar 1:
	•	Interest = ₹100
	•	Total = ₹5200

If Ravi pays ₹200:
	•	Remaining = ₹5000

If Ravi pays ₹5200:
	•	Status = Completed

⸻

🏗️ Future Improvements
	•	Auto cron job for monthly interest
	•	SMS notification for due interest
	•	PDF receipt generation
	•	Admin authentication
	•	Reports & analytics

⸻

🚀 Goal

To build a professional gold loan management system with:
	•	Accurate monthly interest calculation
	•	Proper user & gold tracking
	•	Clear loan lifecycle management
	•	Scalable MongoDB structure
# GoldVault
