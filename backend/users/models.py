import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, username, role, password=None, **extra):
        if not email:    raise ValueError("Email obligatoire")
        if not username: raise ValueError("Pseudo obligatoire")
        user = self.model(
            email=self.normalize_email(email),
            username=username,
            role=role,
            **extra
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra):
        extra.pop('role', None)
        extra['is_staff'] = True
        extra['is_superuser'] = True
        return self.create_user(email, username, 'admin', password, **extra)


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        MECENE     = 'mecene',     'Mécène'
        VOLONTAIRE = 'volontaire', 'Volontaire'
        STRUCTURE  = 'structure',  'Structure technique'
        ADMIN      = 'admin',      'Administrateur'

    class KYCStatus(models.TextChoices):
        PENDING  = 'pending',  'En attente'
        APPROVED = 'approved', 'Approuvé'
        REJECTED = 'rejected', 'Rejeté'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email       = models.EmailField(unique=True)
    username    = models.CharField(max_length=60, unique=True)
    role        = models.CharField(max_length=15, choices=Role.choices)
    first_name  = models.CharField(max_length=60, blank=True)
    last_name   = models.CharField(max_length=60, blank=True)
    phone       = models.CharField(max_length=20, blank=True)
    avatar      = models.ImageField(upload_to='avatars/', null=True, blank=True)
    country     = models.CharField(max_length=60, blank=True)
    organization_name   = models.CharField(max_length=120, blank=True)
    registration_number = models.CharField(max_length=60, blank=True)
    kyc_status  = models.CharField(max_length=10, choices=KYCStatus.choices, default=KYCStatus.PENDING)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio    = models.TextField(blank=True, default="")

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_mecene(self):     return self.role == self.Role.MECENE
    @property
    def is_volontaire(self): return self.role == self.Role.VOLONTAIRE
    @property
    def is_structure(self):  return self.role == self.Role.STRUCTURE
    @property
    def is_admin(self):      return self.role == self.Role.ADMIN
    @property
    def kyc_approved(self):  return self.kyc_status == self.KYCStatus.APPROVED
