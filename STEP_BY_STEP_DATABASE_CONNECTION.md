# 📋 Step-by-Step Guide: Connect to Your Database in VS Code

## ✅ What We've Already Set Up:
- SQLTools extension (installed)
- SQLite driver (installed)  
- Connection configuration in `.vscode/settings.json`

## 🎯 Now Follow These Steps:

### Step 1: Open Command Palette
1. **In VS Code**, press `Ctrl+Shift+P` (or `F1`)
2. You should see a search box at the top of VS Code

### Step 2: Search for SQLTools
1. **Type**: `SQLTools: Connect`
2. **Click** on "SQLTools: Connect" when it appears in the dropdown

### Step 3: Select Your Database
You should see two connection options:
- ✅ **"Local SQLite - user-control-desk"** ← **SELECT THIS ONE**
- "Supabase - user-control-desk" (for later)

### Step 4: View Your Users
Once connected, you'll see a new SQLTools panel. Then:
1. **Expand** the database connection
2. **Expand** "Tables" 
3. **Click** on "users" table
4. **Right-click** → "Show Table Records" (or click the table icon)

## 🎉 You Should See Your 7 Users:
1. hello01@gmail.com (hello)
2. new02@gmail.com (new02)  
3. john01@gmail.com (john)
4. doe@gmail.com (doe)
5. manager03@gmail.com (ghf)
6. asd01@gmail.com (asd)
7. joe01@gmail.com (joe)

## 🔍 Alternative: Run SQL Query
You can also run a custom query:
1. **Click** the "New SQL File" button in SQLTools panel
2. **Type**: `SELECT * FROM users ORDER BY created_at DESC;`
3. **Press** `Ctrl+E` to execute

## ❓ Troubleshooting:
- **If you don't see SQLTools panel**: Go to View → Extensions, search for "SQLTools" and make sure it's enabled
- **If connection fails**: Check that the database file exists at: `C:\Users\intel\main project\user-control-desk\.data\app.db`
- **If you see empty results**: The users are definitely there (we confirmed with our script)

## 🎯 Your Database File Location:
```
C:\Users\intel\main project\user-control-desk\.data\app.db
```

---
💡 **Tip**: Once connected, you can bookmark this connection for easy access later!