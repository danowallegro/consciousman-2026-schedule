from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DETAILS_PATH = ROOT / "work" / "details.json"
OUT_PATH = ROOT / "work" / "consciousman-schedule" / "data.js"


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "event"


def event(
    start: str,
    end: str,
    zone: str,
    speaker: str,
    title: str,
    anchors: list[str] | None = None,
    kind: str = "session",
    note: str = "",
) -> dict:
    return {
        "start": start,
        "end": end,
        "zone": zone,
        "speaker": speaker,
        "title": title,
        "anchors": anchors or [],
        "kind": kind,
        "note": note,
    }


def day(key: str, label: str, date: str, columns: list[str], items: list[dict]) -> dict:
    for item in items:
        item["id"] = f"{key}-{item['start'].replace(':', '')}-{slugify(item['zone'])}-{slugify(item['speaker'] + '-' + item['title'])}"
    return {
        "key": key,
        "label": label,
        "date": date,
        "columns": columns,
        "items": items,
    }


ZONES_5 = [
    "Strefa Wiedzy",
    "Strefa Transformacji",
    "Strefa Umiejętności",
    "Strefa Inspiracji",
    "Młoda Krew",
]

ZONES_6 = [
    "Strefa Wiedzy",
    "Strefa Transformacji",
    "Strefa Umiejętności",
    "Strefa Inspiracji",
    "Młoda Krew",
    "Strefa Pracy z Drewnem",
]

ALL = "Wszyscy"
MAIN = "Scena główna"

SWEAT_LODGE_ANCHORS = ["matlok", "wieconkowski", "praszynski", "gesciak", "jannink"]

days = [
    day(
        "sroda",
        "Środa",
        "1 lipca 2026",
        ZONES_5,
        [
            event("18:30", "20:30", ALL, "", "Ceremonia otwarcia", kind="ceremony"),
            event("20:30", "22:00", MAIN, "Yaacov Darling Khan", "Wezwanie do Obecności: Ceremonia Otwarcia", ["darling-khan"]),
            event("22:00", "23:30", MAIN, "Shamanitu Piotr Sokołowski i Krzysztof Yelenito Jarosiński", "Poza Słowami: W Dźwięku Ciszy i Wiatru - Kąpiel w dźwiękach", ["sokolowski-jarosinski"]),
        ],
    ),
    day(
        "czwartek",
        "Czwartek",
        "2 lipca 2026",
        ZONES_5,
        [
            event("07:00", "09:00", "Strefa Wiedzy", "Marcel Bird Wieteska", "FreedOm Joga - Wolność Ciała i Umysłu", note="Brak szczegółowego opisu w pobranym programie."),
            event("07:00", "09:00", "Strefa Transformacji", "Mana Akitanga", "Haka Mau Rakau", ["hava-2026"]),
            event("07:00", "09:00", "Strefa Umiejętności", "Włodzimierz Wieliczkowski", "Wprowadzenie do Jogi Taoistycznej", ["wieliczkowski"]),
            event("09:00", "10:00", ALL, "", "Śniadanie", kind="meal"),
            event("10:00", "11:30", "Strefa Wiedzy", "Bartosz Zadurski", "Jak rozwiązywać konflikty bez rezygnowania z siebie", ["zadurski"]),
            event("10:00", "11:30", "Strefa Transformacji", "Rafał Górniak", "Relacja z Ojcem - Głęboki Proces Uzdrawiania", ["gorniak"]),
            event("10:00", "11:30", "Strefa Umiejętności", "Adam Kowalewski", "Nie jesteś zmęczony - jesteś przebodźcowany! Jak zrobić RESET układu nerwowego", ["kowalewski"]),
            event("10:00", "11:30", "Strefa Inspiracji", "Maciej Kupś Rob in Wodd", "Z drogi ku zatraceniu do odnalezienia radości życia", ["kups"]),
            event("10:00", "11:30", "Młoda Krew", "", "Krąg otwierający Strefę Młodej Krwi", kind="ceremony"),
            event("12:00", "13:30", "Strefa Wiedzy", "Wojciech Pabjańczyk", "Psychiatria bez etykiet - sens i kontekst", ["pabjanczyk"]),
            event("12:00", "13:30", "Strefa Transformacji", "Męski Team Oddechu: Michał Godlewski, Marek Budzyński, Praktycy Oddechu", "Sesja odrodzenia w oddechu. Męski Duch", ["meski-team"]),
            event("12:00", "13:30", "Strefa Umiejętności", "Tadeusz Smuś", "Mobilność siedzącego wilka: od bólu do świadomości ciała", ["smus"]),
            event("12:00", "13:30", "Strefa Inspiracji", "Marcin Dybuk", "Chłopaki nie płaczą, chłopaki z okien skaczą - od udawanej siły do prawdziwej odwagi", ["dybuk"]),
            event("12:00", "13:30", "Młoda Krew", "Kamil Dołowski", "Parkour - Ruch, wyzwania i decyzje w relacji ze strachem", note="Brak szczegółowego opisu w pobranym programie."),
            event("13:30", "15:00", ALL, "", "Obiad", kind="meal"),
            event("14:00", "15:00", MAIN, "", "Zapisy na ceremonie Szałasu Potu", kind="info"),
            event("15:00", "16:30", "Strefa Wiedzy", "Aleksander Krzywulski", "Otyłość - męska sprawa", ["krzywulski"]),
            event("15:00", "16:30", "Strefa Transformacji", "Kamil Andrzej Mross", "Ruch Spontaniczny i Praca z Procesem: JA jako opiekun wewnętrznej rodziny", ["mross"]),
            event("15:00", "16:30", "Strefa Umiejętności", "Marek Ostrowski", "Niezapisane Umowy Zawodowe", ["ostrowski"]),
            event("15:00", "16:30", "Strefa Inspiracji", "Adam Kowalewski", "Regeneracja to siła. Sen i oddech jako fundament nowej jakości życia", ["kowalewski"]),
            event("15:00", "16:30", "Młoda Krew", "Łukasz Puchalski", "Przygoda z technikami linowymi - nauka wiązania i wykorzystywania węzłów przydatnych we wspinaczce, żeglarstwie i harcerstwie", note="Brak szczegółowego opisu w pobranym programie."),
            event("17:00", "18:30", "Strefa Wiedzy", "Michał Pyziak", "Kręgi Starszyzny", ["michal-pyziak"]),
            event("17:00", "18:30", "Strefa Transformacji", "Marcin Szot", "Moc Świadomego Gniewu", ["szot"]),
            event("17:00", "18:30", "Strefa Umiejętności", "Borys Mańkowski", "Trening poprawiający sprawność całego ciała", ["mankowski"]),
            event("17:00", "18:30", "Strefa Inspiracji", "Andrzej Hrycaj", "Spotkanie z Cieniem", ["hrycaj"]),
            event("17:00", "18:30", "Młoda Krew", "Michał Kowalski", "Czuję więc jestem - Potęga Emocji", ["kowalski"]),
            event("18:30", "19:30", ALL, "", "Kolacja", kind="meal"),
            event("19:30", "21:30", MAIN, "Yaacov Dharling Khan", "Kucie Wewnętrznej Mocy: Przemiana Ciężaru Przeszłości w Siłę na Dziś", note="Brak szczegółowego opisu tego spotkania w pobranym programie."),
            event("22:00", "23:30", MAIN, "Mateusz Mattenia Trembaczowski", "Baśń archetypiczna z warsztatem podróży bohatera", ["mattenia"]),
        ],
    ),
    day(
        "piatek",
        "Piątek",
        "3 lipca 2026",
        ZONES_6,
        [
            event("04:00", "09:00", ALL, "Piotr Matłok, Wojciech Wieconkowski, Roman Praszyński, Sławomir Gęściak, Dario Eglie, Zowie Jannik", "Ceremonia Szałasu Potu", SWEAT_LODGE_ANCHORS, "ceremony", "Dario Eglie nie ma osobnego opisu w pobranym programie."),
            event("07:00", "09:00", "Strefa Wiedzy", "Jan Szpil", "Joga Regeneracyjna", ["szpil"]),
            event("07:00", "09:00", "Strefa Transformacji", "Mana Akitanga", "AOMANA", ["hava-2026"]),
            event("07:00", "09:00", "Strefa Umiejętności", "Włodzimierz Wieliczkowski", "Regulacja stanów psychoemocjonalnych (Energetyczna i psychofizyczna samoobrona)", ["wieliczkowski"]),
            event("09:00", "10:00", ALL, "", "Śniadanie", kind="meal"),
            event("10:00", "11:30", "Strefa Wiedzy", "Bartosz Horajecki", "Angielski dla facetów - skutecznie i rozwojowo", ["horajecki"]),
            event("10:00", "11:30", "Strefa Transformacji", "Jacek Masłowski", "Mężczyzna na/prawdę...", ["maslowski"]),
            event("10:00", "11:30", "Strefa Umiejętności", "Michał Mysza", "Warsztaty Śpiewu Gardłowego - Myszterium", ["mysza"]),
            event("10:00", "11:30", "Strefa Inspiracji", "Michał Shootman Majewski", "Mężczyzna u Bram Życia: Nowa Wizja Narodzin", ["majewski"]),
            event("10:00", "11:30", "Młoda Krew", "Wiktor Trybała", "Kod Braterstwa: Od głowy do ciała, od chaosu do zaufania", ["trybala"]),
            event("10:00", "11:30", "Strefa Pracy z Drewnem", "Maciej Kupś", "Drewnoterapia: Uwalnianie umiejętności", ["maciej-kups"]),
            event("12:00", "13:30", "Strefa Wiedzy", "Mikołaj Rykowski", "Przewrotnie, ale życiowo: Samotność łączy", ["rykowski"]),
            event("12:00", "13:30", "Strefa Transformacji", "Łukasz Stanek", "Z Radością Uniosę Twój Ciężar - ojcostwo, dzieciństwo, relacje", ["syriusz"]),
            event("12:00", "13:30", "Strefa Umiejętności", "Michał \"Baba\" Baciński", "Movement FLOW", ["baba"]),
            event("12:00", "13:30", "Strefa Inspiracji", "Michał Ratajski & Tymoteusz Niemiec", "Przestrzeń M - miejsca współdziałania dla Mężczyzn - Ty też możesz!", note="Brak szczegółowego opisu w pobranym programie."),
            event("12:00", "13:30", "Młoda Krew", "Krzysztof Kisiel", "Odwaga, która ratuje", ["kisiel"]),
            event("12:00", "13:30", "Strefa Pracy z Drewnem", "Łukasz Puchalski", "Czy manie ramy?!", ["puchalski"]),
            event("13:30", "15:00", ALL, "", "Obiad", kind="meal"),
            event("15:00", "16:30", ALL, "", "Kręgi męskie", kind="ceremony"),
            event("17:00", "18:30", "Strefa Wiedzy", "Paweł Viking Pawlak", "PowerLiving czyli Podświadomość Po Męsku", ["pawlak"]),
            event("17:00", "18:30", "Strefa Transformacji", "Michał Pyziak", "Upadek jako brama do rozwoju", ["pyziak"]),
            event("17:00", "18:30", "Strefa Umiejętności", "Marcin Urzędowski", "Uważność w Rytmie - warsztat gry na bębnach", ["urzedowski"]),
            event("17:00", "18:30", "Strefa Inspiracji", "Kacper Klimczak - Pedagog Szczęścia", "Jak przestać się mijać w relacji i w końcu się dogadać?", ["klimczak"]),
            event("17:00", "18:30", "Młoda Krew", "Tymoteusz Niemiec", "Tato, synu - widzę Cię, słyszę Cię", ["niemiec"]),
            event("17:00", "18:30", "Strefa Pracy z Drewnem", "Strefa Saunowania: Grzegorz Prus", "Żywioły w saunie - sztuka wchodzenia w temperaturę", ["prus"]),
            event("18:30", "19:30", ALL, "", "Kolacja", kind="meal"),
            event("19:30", "21:30", MAIN, "Michał Godlewski", "Dance of Life: Ceremonia Życia", note="Brak szczegółowego opisu tego spotkania w pobranym programie."),
            event("22:00", "23:30", MAIN, "Foka", "Spotkanie z Pieśniami Serca przy Ogniu", ["foka"]),
            event("23:30", "01:30", MAIN, "", "Podróż przy dźwiękach mis i gongów", kind="ceremony", note="Brak szczegółowego opisu w pobranym programie."),
        ],
    ),
    day(
        "sobota",
        "Sobota",
        "4 lipca 2026",
        ZONES_6,
        [
            event("04:00", "09:00", ALL, "Piotr Matłok, Wojciech Wieconkowski, Roman Praszyński, Sławomir Gęściak, Dario Eglie, Zowie Jannik", "Ceremonia Szałasu Potu", SWEAT_LODGE_ANCHORS, "ceremony", "Dario Eglie nie ma osobnego opisu w pobranym programie."),
            event("07:00", "09:00", "Strefa Wiedzy", "Raj NaamJot Singh", "Ruch do Ciszy - Joga Nidra i Klasyczne Surya Namaskar", ["naamjot"]),
            event("07:00", "09:00", "Strefa Transformacji", "Tomek Eichelberger", "Transformacja poprzez qigong", ["eichelberger"]),
            event("07:00", "09:00", "Strefa Umiejętności", "Włodzimierz Wieliczkowski", "TAO relacji (Joga seksu)", ["wieliczkowski"]),
            event("07:00", "09:00", "Młoda Krew", "Team Młodej Krwi", "Przygoda dla Młodej Krwi", note="Brak szczegółowego opisu w pobranym programie."),
            event("09:00", "10:00", ALL, "", "Śniadanie", kind="meal"),
            event("10:00", "11:30", "Strefa Wiedzy", "Paweł Holas", "Wojownik serca. Obecność, współczucie i dojrzała męska siła", ["holas"]),
            event("10:00", "11:30", "Strefa Transformacji", "Łukasz Falkiewicz", "Technika Uwalniania Emocji - Mężczyzna bez maski", ["falkiewicz"]),
            event("10:00", "11:30", "Strefa Umiejętności", "Maciej Borucz", "Playfight - okiełznaj swoją dzikość", ["borucz"]),
            event("10:00", "11:30", "Strefa Inspiracji", "Michał Pyziak & Team", "Spotkanie Starsi i Młodsi", ["michal-pyziak"]),
            event("10:00", "11:30", "Młoda Krew", "Mateusz Kozłowski", "Anatomia hejtu - Neurobiologia i psychologia cyfrowej agresji", ["kozlowski"]),
            event("10:00", "11:30", "Strefa Pracy z Drewnem", "Maciej Kupś", "Tworzymy domy letnie dla nietoperzy", ["maciej-kups"]),
            event("12:00", "13:30", "Strefa Wiedzy", "Dawid Rzepecki", "Od presji do obecności: nowy model męskiej seksualności", ["rzepecki"]),
            event("12:00", "13:30", "Strefa Transformacji", "Kacper Klimczak - Pedagog Szczęścia", "Męskie doświadczanie złości", ["klimczak"]),
            event("12:00", "13:30", "Strefa Umiejętności", "Karol Dziubek", "Odkryj swoją drogę zawodową", ["dziubek"]),
            event("12:00", "13:30", "Strefa Inspiracji", "Adam Dyja", "Męska Materia: Nowotwory dotykające mężczyzn - profilaktyka bez tabu", ["dyja"]),
            event("12:00", "13:30", "Młoda Krew", "Emil Różewski", "Trening MMA prowadzony przez trenera kadry narodowej", ["rozewski"]),
            event("12:00", "16:00", MAIN, "Andrzej Hrycaj", "Jaja w lodzie, ogień w sercu - Strefa morsowania - balia z lodem", ["hrycaj"], "ceremony"),
            event("13:30", "15:00", ALL, "", "Obiad", kind="meal"),
            event("13:30", "15:00", MAIN, "Joel Madaliński-Artur", "Muzyka jako doświadczenie wewnętrzne - recital fortepianowy", note="Brak szczegółowego opisu w pobranym programie."),
            event("15:00", "16:30", "Strefa Wiedzy", "Tomasz Gulak", "Cel, Kierunek, Działanie: Jak Zamieniać Wizję w Rezultat?", ["gulak"]),
            event("15:00", "16:30", "Strefa Transformacji", "Paweł Viking Pawlak", "PowerLiving czyli Podświadomość Po Męsku", ["pawlak"]),
            event("15:00", "16:30", "Strefa Umiejętności", "Michał Głuc", "Jak zrozumieć ostrze - świadoma inicjacja", ["gluc"]),
            event("15:00", "16:30", "Strefa Inspiracji", "Arkadiusz Pilarz", "Drugie Życie - Nowe Życie - INACZEJ niż ZWYKLE", ["pilarz"]),
            event("15:00", "16:30", "Młoda Krew", "Marek Budziński", "RESET - Ogarnij Przeładowanie, Wróć do Siebie", ["budzinski"]),
            event("17:00", "18:30", "Strefa Wiedzy", "Kamil Lelonek", "Siła zaczyna się w biologii - jak zadbać o fundamenty zdrowego życia", ["lelonek"]),
            event("17:00", "18:30", "Strefa Transformacji", "Mariusz Bocian Atru", "Męska stabilność w relacjach i kryzysach", ["bocian"]),
            event("17:00", "18:30", "Strefa Umiejętności", "Łukasz Zygmunt", "Twoja Relacja jako Ścieżka Rozwoju: Praktyki dla Świadomego Partnera", ["zygmunt"]),
            event("17:00", "18:30", "Strefa Inspiracji", "Wojciech Mróz", "Męski Spacer - doświadczenie inne niż kręgi", ["mroz"]),
            event("17:00", "18:30", "Młoda Krew", "Michał Shootman Majewski", "WEWNĘTRZNY TWÓRCA", ["michal-majewski"]),
            event("18:30", "19:30", ALL, "", "Kolacja", kind="meal"),
            event("19:30", "21:30", MAIN, "Michał Ratajski", "Męskie Poruszenie - Ceremonia Integracji Doświadczeń Festiwalu", ["ratajski"]),
            event("22:00", "23:30", MAIN, "Phao Sanato", "Krąg Pieśni Ognia", ["sanato"]),
        ],
    ),
    day(
        "niedziela",
        "Niedziela",
        "5 lipca 2026",
        ZONES_6,
        [
            event("08:00", "10:00", "Strefa Wiedzy", "Tomasz Sol", "Do domu w równowadze - powrót do siebie po festiwalu", note="Brak szczegółowego opisu w pobranym programie."),
            event("08:00", "10:00", "Strefa Transformacji", "Marcin Karbowski", "Powrót do siebie - integracja i domknięcie", ["karbowski"]),
            event("08:00", "10:00", "Strefa Umiejętności", "Tomek Eichelberger", "Transformacja poprzez qigong", ["eichelberger"]),
            event("08:00", "10:00", "Młoda Krew", "", "Krąg zamykający Strefę Młodej Krwi", kind="ceremony"),
            event("10:00", "11:00", ALL, "", "Śniadanie", kind="meal"),
            event("11:00", "13:30", ALL, "", "Ceremonia zamknięcia", kind="ceremony"),
        ],
    ),
]


def main() -> None:
    details = json.loads(DETAILS_PATH.read_text(encoding="utf-8"))
    data = {
        "event": {
            "name": "Conscious Man 2026",
            "subtitle": "1-5 lipca 2026 | Przyłęk, gm. Paradyż",
            "dates": "1-5 lipca 2026",
            "location": "Przyłęk, gm. Paradyż",
            "sourceUrl": "https://consciousman.pl/program-2026/",
        },
        "days": days,
        "details": details,
        "offline": {
            "cacheName": "consciousman-2026-shell-v9",
            "files": [
                "./",
                "./index.html",
                "./styles.css",
                "./app.js",
                "./data.js",
                "./manifest.webmanifest",
            ],
        },
    }
    OUT_PATH.write_text(
        "window.SCHEDULE_DATA = "
        + json.dumps(data, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
