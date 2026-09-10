from django.core.management.base import BaseCommand
from accounts.models import Content

# game_code -> (old leading emoji, new leading emoji)
EMOJI_UPDATES = {
    "financial_concept_hunt": ("🧠", "📊"),
    "financial_system_concepts_2": ("🧭", "📊"),
    "income_type_assessment": ("💵", "📊"),
    "media_literacy_assessment": ("📰", "📊"),
    "legal_investment_assessment_2": ("🔐", "📊"),
    "debt_credit_assessment": ("🏦", "📊"),
    "debt_credit_assessment_2": ("🧮", "📊"),
    "asset_income_expense_assessment": ("💻", "📊"),
    "investment_consumption_case_assessment": ("⚖️", "📊"),
    "economic_glossary_match": ("📖", "🧩"),
    "income_glossary_puzzle": ("💰", "🧩"),
    "fraud_hunt_glossary_puzzle": ("🎣", "🧩"),
    "legal_investment_glossary_puzzle": ("⚖️", "🧩"),
}


class Command(BaseCommand):
    help = "Mevcut oyun içeriklerinin başlığındaki eski emojiyi, güncellenen anket/bulmaca emojisiyle değiştirir."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Değişiklikleri kaydetmeden sadece neyin güncelleneceğini gösterir.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        total_updated = 0

        for game_code, (old_emoji, new_emoji) in EMOJI_UPDATES.items():
            contents = Content.objects.filter(game_code=game_code, title__startswith=old_emoji)
            for content in contents:
                new_title = new_emoji + content.title[len(old_emoji):]
                self.stdout.write(f"[{game_code}] {content.title!r} -> {new_title!r}")
                if not dry_run:
                    content.title = new_title
                    content.save(update_fields=["title"])
                total_updated += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f"{total_updated} içerik güncellenecekti (dry-run, kaydedilmedi)."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{total_updated} içerik başlığı güncellendi."))
