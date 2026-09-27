import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./civicai.db")

def setup_database():
    db_url = os.getenv("DATABASE_URL", "sqlite:///./civicai.db")
    if not db_url:
        db_url = "sqlite:///./civicai.db"

    if db_url.startswith("postgresql"):
        parsed_url = urlparse(db_url)
        dbname = parsed_url.path[1:] if parsed_url.path else "civicai"
        
        username = parsed_url.username or "postgres"
        password = parsed_url.password or "postgres"
        host = parsed_url.hostname or "localhost"
        port = parsed_url.port or 5432

        print(f"Connecting to PostgreSQL host={host}:{port} as user={username} to verify database...")
        
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user=username,
                password=password,
                host=host,
                port=port
            )
            conn.autocommit = True
            cursor = conn.cursor()
            
            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{dbname}';")
            exists = cursor.fetchone()
            
            if not exists:
                print(f"Database '{dbname}' does not exist. Creating...")
                cursor.execute(f"CREATE DATABASE {dbname};")
                print(f"Database '{dbname}' successfully created.")
            else:
                print(f"Database '{dbname}' already exists.")
                
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"PostgreSQL connection warning: {e}")
            print("Proceeding with table initialization via SQLAlchemy...")
    else:
        print(f"Using database: {db_url}")

    # Create tables by importing Base and engine
    print("Creating tables in database...")
    from app.database.connection import engine, Base
    from app.models.user import User
    from app.models.complaint import Complaint
    
    Base.metadata.create_all(bind=engine)
    print("All tables initialized successfully.")

    # Seed demo user accounts
    print("Seeding demo citizen and admin accounts...")
    from app.database.connection import SessionLocal
    from app.services.auth import get_password_hash
    
    session = SessionLocal()
    try:
        # Check if demo citizen exists
        citizen_exists = session.query(User).filter(User.email == "citizen@example.com").first()
        if not citizen_exists:
            citizen = User(
                name="Demo Citizen",
                email="citizen@example.com",
                password=get_password_hash("password123"),
                role="CITIZEN"
            )
            session.add(citizen)

        # Check if demo admin exists
        admin_exists = session.query(User).filter(User.email == "admin@civicai.gov").first()
        if not admin_exists:
            admin = User(
                name="Demo Admin",
                email="admin@civicai.gov",
                password=get_password_hash("adminpassword"),
                role="ADMIN"
            )
            session.add(admin)
        
        session.commit()
        print("Demo accounts seeded successfully:")
        print("  - Citizen: citizen@example.com / password123")
        print("  - Admin: admin@civicai.gov / adminpassword")

        # Seed sample complaints if table is empty
        if session.query(Complaint).count() == 0:
            print("Seeding sample complaint filings for demonstration...")
            demo_citizen = session.query(User).filter(User.email == "citizen@example.com").first()
            if demo_citizen:
                sample_complaints = [
                    Complaint(
                        user_id=demo_citizen.id,
                        description="Large pothole on 5th Avenue causing vehicle damage and traffic slowdown.",
                        latitude=18.5204,
                        longitude=73.8567,
                        status="PENDING",
                        category="Roads & Infrastructure",
                        severity="MEDIUM"
                    ),
                    Complaint(
                        user_id=demo_citizen.id,
                        description="Major water pipeline leakage near downtown plaza overflowing onto main street.",
                        latitude=18.5220,
                        longitude=73.8580,
                        status="IN_PROGRESS",
                        category="Utilities & Lighting",
                        severity="HIGH",
                        assigned_to="Water Supply Board",
                        admin_notes="Technician dispatched with repair crew."
                    ),
                    Complaint(
                        user_id=demo_citizen.id,
                        description="Garbage bin overflow and uncollected waste near community market.",
                        latitude=18.5180,
                        longitude=73.8540,
                        status="RESOLVED",
                        category="Waste Management & Sanitation",
                        severity="MEDIUM",
                        assigned_to="Sanitation Dept",
                        admin_notes="Trash cleared and replacement bin installed."
                    ),
                    Complaint(
                        user_id=demo_citizen.id,
                        description="Electric transformer sparking with live wire hazard and smoke near block 4.",
                        latitude=18.5210,
                        longitude=73.8575,
                        status="PENDING",
                        category="Public Safety & Hazards",
                        severity="CRITICAL"
                    ),
                    Complaint(
                        user_id=demo_citizen.id,
                        description="Major vehicle accident and fallen tree blocking 2 lanes near central junction.",
                        latitude=18.5212,
                        longitude=73.8572,
                        status="IN_PROGRESS",
                        category="Public Safety & Hazards",
                        severity="CRITICAL",
                        assigned_to="Emergency Rapid Response"
                    ),
                ]
                session.add_all(sample_complaints)
                session.commit()
                print("Sample complaints successfully seeded!")
    except Exception as se:
        session.rollback()
        print("Warning: Seeding failed or skipped:", se)
    finally:
        session.close()

if __name__ == "__main__":
    setup_database()
