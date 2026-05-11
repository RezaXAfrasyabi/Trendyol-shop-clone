# Trendyol shop clone

A small e-commerce storefront with a vanilla HTML/CSS/JavaScript frontend and a Python [Flask](https://flask.palletsprojects.com/) API. The same server serves the static site and REST endpoints under `/api`.

## Features

- Product catalog, cart, and checkout flow
- SQLite persistence
- Admin area for orders and catalog (JWT-backed)

## Requirements

- Python 3.10+ (3.11+ recommended)

## Quick start

1. Clone the repository and enter the project directory.

2. Create a virtual environment and install dependencies:

   ```bash
   cd backend
   python -m venv .venv
   ```

   Activate it:

   - Windows (PowerShell): `.\.venv\Scripts\Activate.ps1`
   - macOS/Linux: `source .venv/bin/activate`

   ```bash
   pip install -r requirements.txt
   ```

3. **Set `SECRET_KEY` for anything beyond local play.** Copy `.env.example` to `.env` in the project root and fill in `SECRET_KEY`, or export it in your shell. The app loads `.env` from the project root on startup. For quick local tries you can skip this and use the development default, but change it before deploying.

4. Initialize the database and start the server:

   ```bash
   python app.py
   ```

5. Open [http://localhost:5000](http://localhost:5000) in your browser.

### Optional: sample products

With the virtual environment active and your working directory still `backend`:

```bash
python add_products.py
```

## Configuration

| Variable      | Description                                      |
| ------------- | ------------------------------------------------ |
| `SECRET_KEY`  | Flask secret; used for signing admin JWTs.     |

The frontend API base URL is set in `js/config.js` (`API_URL`). It defaults to `http://localhost:5000/api` for local use.

## Project layout

```
├── backend/          # Flask app, SQLite DB (created on first run)
│   ├── app.py
│   ├── add_products.py
│   └── requirements.txt
├── css/
├── js/
└── index.html
```

The SQLite file `backend/shop.db` is created automatically and is ignored by Git.

## Admin access

On first run, if no admin user exists, the app seeds a default admin (see startup logs or `app.py` for the default credentials). **Change this password immediately** in any shared or production environment.
