import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()

from events.models import Category

def add_cats():
    p, _ = Category.objects.get_or_create(name='Party')
    f, _ = Category.objects.get_or_create(name='Function')
    print(f"Categories added: Party ({_}), Function ({_})")

if __name__ == "__main__":
    add_cats()
