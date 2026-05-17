import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_admin():
    username = 'superadmin'
    email = 'admin@eventplatform.com'
    password = 'adminpassword123'
    
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role='admin' # Set the custom role to admin
        )
        print("Admin User Created Successfully!")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"Role: admin")
    else:
        # Update existing user if needed
        u = User.objects.get(username=username)
        u.role = 'admin'
        u.is_staff = True
        u.is_superuser = True
        u.save()
        print(f"User '{username}' updated to Admin role.")

if __name__ == '__main__':
    create_admin()
