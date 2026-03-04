from django.urls import path
from . import views

urlpatterns = [
    # Pública
    path('',                    views.equipos,         name='equipos'),
    path('api/equipos/',        views.api_equipos,     name='api_equipos'),

    # Panel admin
    path('admin-panel/',                            views.admin_panel,      name='admin_panel'),
    path('admin-panel/equipo/nuevo/',               views.equipo_form,      name='equipo_nuevo'),
    path('admin-panel/equipo/<int:pk>/editar/',     views.equipo_form,      name='equipo_editar'),
    path('admin-panel/equipo/<int:pk>/eliminar/',   views.equipo_eliminar,  name='equipo_eliminar'),
    path('admin-panel/equipo/<int:equipo_pk>/jugador/nuevo/',           views.jugador_form,     name='jugador_nuevo'),
    path('admin-panel/equipo/<int:equipo_pk>/jugador/<int:pk>/editar/', views.jugador_form,     name='jugador_editar'),
    path('admin-panel/jugador/<int:pk>/eliminar/',                      views.jugador_eliminar, name='jugador_eliminar'),
]