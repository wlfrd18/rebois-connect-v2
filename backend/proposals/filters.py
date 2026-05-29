import django_filters
from .models import Proposal


class ProposalFilter(django_filters.FilterSet):
    """
    Filtres pour la marketplace et l'interface admin.
    Exemple : /api/v1/proposals/?country=CM&min_surface=1&max_surface=50
    """
    country     = django_filters.CharFilter(field_name="address_country", lookup_expr="icontains")
    region      = django_filters.CharFilter(field_name="address_region",  lookup_expr="icontains")
    land_type   = django_filters.ChoiceFilter(choices=Proposal.LandType.choices)
    status      = django_filters.ChoiceFilter(choices=Proposal.Status.choices)
    min_surface = django_filters.NumberFilter(field_name="surface_hectares", lookup_expr="gte")
    max_surface = django_filters.NumberFilter(field_name="surface_hectares", lookup_expr="lte")
    min_co2     = django_filters.NumberFilter(field_name="co2_estimated_tons", lookup_expr="gte")

    class Meta:
        model  = Proposal
        fields = ["country", "region", "land_type", "status", "min_surface", "max_surface"]
