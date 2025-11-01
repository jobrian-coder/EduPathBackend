from django.contrib import admin
from .models import Career, CareerProsCons


class CareerProsConsInline(admin.TabularInline):
    model = CareerProsCons
    extra = 2


@admin.register(Career)
class CareerAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'avg_salary_ksh', 'job_demand_score', 'growth_rate']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    inlines = [CareerProsConsInline]


@admin.register(CareerProsCons)
class CareerProsConsAdmin(admin.ModelAdmin):
    list_display = ['career', 'type']
    list_filter = ['type']
    search_fields = ['career__name']
