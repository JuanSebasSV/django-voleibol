from django.db import models

class Equipo(models.Model):
    slug        = models.SlugField(unique=True)          # 'italia', 'polonia', 'brasil'
    nombre      = models.CharField(max_length=100)       # 'ITALIA'
    subtitulo   = models.CharField(max_length=200)
    clase_color = models.CharField(max_length=50)        # 'equipo-italia'
    imagen      = models.CharField(max_length=100)       # 'equipo-italia.png'

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'


class Jugador(models.Model):
    POSICIONES = [
        ('Armador',           'Armador'),
        ('Receptor/Atacante', 'Receptor/Atacante'),
        ('Central',           'Central'),
        ('Opuesto',           'Opuesto'),
        ('Líbero',            'Líbero'),
    ]

    equipo          = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='jugadores')
    orden           = models.PositiveSmallIntegerField(default=0)   # 0-5, posición en cancha
    nombre          = models.CharField(max_length=60)               # apellido corto
    nombre_completo = models.CharField(max_length=120)
    hobby = models.CharField(max_length=120, default='')    
    posicion        = models.CharField(max_length=30, choices=POSICIONES)
    edad            = models.PositiveSmallIntegerField()
    altura_cm       = models.PositiveSmallIntegerField()            # solo el número
    peso_kg         = models.PositiveSmallIntegerField()
    foto            = models.CharField(max_length=100)              # 'jugador1.png'

    def __str__(self):
        return f'{self.nombre_completo} ({self.equipo.nombre})'

    class Meta:
        ordering = ['equipo', 'orden']
        verbose_name = 'Jugador'
        verbose_name_plural = 'Jugadores'