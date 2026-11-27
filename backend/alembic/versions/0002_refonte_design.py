"""refonte du design : métiers illustrés, apprentissage, objet du message

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-27 03:30:00

Les nouvelles colonnes ont une valeur par défaut : les lignes existantes restent
valides. Les textes des trois métiers sont remplis au démarrage par bootstrap.py
(seulement s'ils sont vides), pour ne jamais écraser ce qu'Ayem a saisi.
"""

import sqlalchemy as sa

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _enum(name: str, *values: str) -> sa.Enum:
    return sa.Enum(*values, name=name, native_enum=False, length=30, create_constraint=True)


def upgrade() -> None:
    op.add_column(
        "metier", sa.Column("description", sa.JSON(), nullable=False, server_default="{}")
    )
    op.add_column("metier", sa.Column("offre", sa.JSON(), nullable=False, server_default="{}"))
    op.add_column(
        "metier",
        sa.Column(
            "figure",
            _enum("ck_figuremetier", "graphique", "pipeline", "application"),
            nullable=False,
            server_default="application",
        ),
    )
    op.add_column(
        "metier",
        sa.Column(
            "couleur",
            _enum("ck_couleurmetier", "corail", "bleu", "vert", "ambre", "violet"),
            nullable=False,
            server_default="corail",
        ),
    )
    op.add_column(
        "technologie", sa.Column("source", sa.JSON(), nullable=False, server_default="{}")
    )
    op.add_column(
        "technologie",
        sa.Column("progression", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "message",
        sa.Column(
            "objet",
            _enum("ck_objetmessage", "projet", "stage", "emploi", "autre"),
            nullable=False,
            server_default="autre",
        ),
    )
    op.add_column(
        "message",
        sa.Column("entreprise", sa.String(length=255), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("message", "entreprise")
    op.drop_column("message", "objet")
    op.drop_column("technologie", "progression")
    op.drop_column("technologie", "source")
    op.drop_column("metier", "couleur")
    op.drop_column("metier", "figure")
    op.drop_column("metier", "offre")
    op.drop_column("metier", "description")
