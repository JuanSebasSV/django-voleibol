from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.cache import never_cache        
from django.contrib import messages

from .models import Equipo, Jugador


# ── Vista pública ──────────────────────────────────────────────────────────────
def equipos(request):
    return render(request, 'equipos/index.html')


# ── API JSON ───────────────────────────────────────────────────────────────────
def api_equipos(request):
    data = {}
    for equipo in Equipo.objects.prefetch_related('jugadores').all():
        data[equipo.slug] = {
            'nombre':      equipo.nombre,
            'subtitulo':   equipo.subtitulo,
            'claseColor':  equipo.clase_color,
            'jugadores': [
                {
                    'nombre':         j.nombre,
                    'nombreCompleto': j.nombre_completo,
                    'posicion':       j.posicion,
                    'edad':           j.edad,
                    'altura':         f'{j.altura_cm} cm',
                    'peso':           f'{j.peso_kg} kg',
                    'foto':           j.foto,
                }
                for j in equipo.jugadores.order_by('orden')
            ]
        }
    return JsonResponse(data)


# ── Panel admin ────────────────────────────────────────────────────────────────
@never_cache                                                  # ← agregar esto
@login_required
def admin_panel(request):
    equipos_list = Equipo.objects.prefetch_related('jugadores').all()
    return render(request, 'equipos/admin/panel.html', {'equipos': equipos_list})


# ── Equipo: crear / editar ─────────────────────────────────────────────────────
@login_required
def equipo_form(request, pk=None):
    equipo = get_object_or_404(Equipo, pk=pk) if pk else None
    if request.method == 'POST':
        data = request.POST
        if equipo:
            equipo.nombre      = data['nombre']
            equipo.subtitulo   = data['subtitulo']
            equipo.clase_color = data['clase_color']
            equipo.imagen      = data['imagen']
            equipo.save()
            messages.success(request, f'Equipo {equipo.nombre} actualizado.')
        else:
            equipo = Equipo.objects.create(
                slug        = data['slug'],
                nombre      = data['nombre'],
                subtitulo   = data['subtitulo'],
                clase_color = data['clase_color'],
                imagen      = data['imagen'],
            )
            messages.success(request, f'Equipo {equipo.nombre} creado.')
        return redirect('admin_panel')
    return render(request, 'equipos/admin/equipo_form.html', {'equipo': equipo})


@login_required
def equipo_eliminar(request, pk):
    equipo = get_object_or_404(Equipo, pk=pk)
    if request.method == 'POST':
        nombre = equipo.nombre
        equipo.delete()
        messages.success(request, f'Equipo {nombre} eliminado.')
        return redirect('admin_panel')
    return render(request, 'equipos/admin/confirmar_eliminar.html', {'objeto': equipo, 'tipo': 'equipo'})


# ── Jugador: crear / editar ────────────────────────────────────────────────────
@login_required
def jugador_form(request, equipo_pk, pk=None):
    equipo  = get_object_or_404(Equipo, pk=equipo_pk)
    jugador = get_object_or_404(Jugador, pk=pk, equipo=equipo) if pk else None
    if request.method == 'POST':
        d = request.POST
        campos = dict(
            equipo          = equipo,
            orden           = int(d['orden']),
            nombre          = d['nombre'],
            nombre_completo = d['nombre_completo'],
            posicion        = d['posicion'],
            edad            = int(d['edad']),
            altura_cm       = int(d['altura_cm']),
            peso_kg         = int(d['peso_kg']),
            foto            = d['foto'],
        )
        if jugador:
            for k, v in campos.items():
                setattr(jugador, k, v)
            jugador.save()
            messages.success(request, f'{jugador.nombre_completo} actualizado.')
        else:
            jugador = Jugador.objects.create(**campos)
            messages.success(request, f'{jugador.nombre_completo} creado.')
        return redirect('admin_panel')
    return render(request, 'equipos/admin/jugador_form.html', {
        'equipo': equipo, 'jugador': jugador,
        'posiciones': Jugador.POSICIONES,
    })


@login_required
def jugador_eliminar(request, pk):
    jugador = get_object_or_404(Jugador, pk=pk)
    if request.method == 'POST':
        nombre = jugador.nombre_completo
        jugador.delete()
        messages.success(request, f'{nombre} eliminado.')
        return redirect('admin_panel')
    return render(request, 'equipos/admin/confirmar_eliminar.html', {'objeto': jugador, 'tipo': 'jugador'})