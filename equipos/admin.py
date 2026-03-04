from django.contrib import admin
from .models import Equipo, Jugador

class JugadorInline(admin.TabularInline):
    model = Jugador
    extra = 0
    fields = ['orden', 'nombre', 'nombre_completo', 'posicion', 'edad', 'altura_cm', 'peso_kg', 'foto']

@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'subtitulo', 'slug']
    prepopulated_fields = {'slug': ('nombre',)}
    inlines = [JugadorInline]

@admin.register(Jugador)
class JugadorAdmin(admin.ModelAdmin):
    list_display  = ['nombre_completo', 'equipo', 'posicion', 'edad', 'altura_cm', 'peso_kg']
    list_filter   = ['equipo', 'posicion']
    search_fields = ['nombre_completo', 'nombre']