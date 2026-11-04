
const SUPABASE_URL =
    "https://ntwzzmnmbouclsoximwq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_UZlebM4VdEBacdWpJAcbBg_6gb6vm2l";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let polseregnIntervall = null;

function norskDato() {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function hentBesokendeId() {
    const nokkel = "polsefest_besokende_id";

    let id = localStorage.getItem(nokkel);

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(nokkel, id);
    }

    return id;
}

function harMeldtIdag() {
    return localStorage.getItem("polsefest_sist_meldt")
        === norskDato();
}

function oppdaterKnapp() {
    const knapp = document.getElementById("behovKnapp");

    if (harMeldtIdag()) {
        knapp.disabled = true;
        knapp.innerText = "Behov meldt!";
    } else {
        knapp.disabled = false;
        knapp.innerText = "Meld pølsefest-behov";
    }
}

async function hentBehov() {
    const teller = document.getElementById("behovTeller");

    const { data, error } = await supabaseClient
        .rpc("hent_polsebehov");

    if (error) {
        console.error("Kunne ikke hente behov:", error);
        teller.innerText = "Kunne ikke hente dagens behov.";
        return;
    }

    teller.innerText = `Behov meldt i dag: ${data}`;
    oppdaterKnapp();
}

async function meldBehov() {
    const knapp = document.getElementById("behovKnapp");

    if (harMeldtIdag() || knapp.disabled) {
        return;
    }

    knapp.disabled = true;
    knapp.innerText = "Registrerer...";

    try {
        const besokendeId = hentBesokendeId();

        const { data, error } = await supabaseClient
            .rpc("meld_polsebehov", {
                p_besokende_id: besokendeId
            });

        if (error) {
            throw error;
        }

        const resultat = data[0];

        localStorage.setItem(
            "polsefest_sist_meldt",
            norskDato()
        );

        document.getElementById("behovTeller").innerText =
            `Behov meldt i dag: ${resultat.totalt}`;

        oppdaterKnapp();

    } catch (error) {
        console.error("Kunne ikke melde behov:", error);

        knapp.disabled = false;
        knapp.innerText = "Prøv igjen";
    }
}

async function hentStatus() {
    const { data, error } = await supabaseClient
        .from("status")
        .select("*")
        .limit(1)
        .single();

    if (error) {
        console.error("Klarte ikke å hente status:", error);

        document.body.className = "rod";
        document.getElementById("status").innerText =
            "UKJENT";

        document.getElementById("info").innerText =
            "Klarte ikke å sjekke pølsestatus akkurat nå.";

        document.getElementById("behovSeksjon")
            .classList.add("hidden");

        stoppPolseregn();
        return;
    }

    visStatus(data);
}

function visStatus(status) {
    const behovSeksjon =
        document.getElementById("behovSeksjon");

    if (status.polsefest) {
        document.body.className = "gronn";

        document.getElementById("status").innerText = "JA";

        document.getElementById("info").innerText =
            `På ${status.sted}. ${status.pris} kr per pølse.`;

        behovSeksjon.classList.add("hidden");
        startPolseregn();

    } else {
        document.body.className = "rod";

        document.getElementById("status").innerText = "NEI";

        document.getElementById("info").innerText =
            status.melding ||
            "Dessverre, ingen pølsefest akkurat nå.";

        stoppPolseregn();
        behovSeksjon.classList.remove("hidden");

        hentBehov();
    }

    if (status.oppdatert) {
        const dato = new Date(status.oppdatert);

        const bekreftetDato =
            dato.toLocaleDateString("nb-NO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "Europe/Oslo"
            });

        const bekreftetTid =
            dato.toLocaleTimeString("nb-NO", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Oslo"
            });

        const datoDeler = new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Europe/Oslo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(dato);

        const finn = type =>
            Number(datoDeler.find(p => p.type === type).value);

        const gyldigTil = new Date(Date.UTC(
            finn("year"),
            finn("month") - 1,
            finn("day")
        ));

        const ukedag = gyldigTil.getUTCDay();
        const dagerTilSondag = ukedag === 0
            ? 0
            : 7 - ukedag;

        gyldigTil.setUTCDate(
            gyldigTil.getUTCDate() + dagerTilSondag
        );

        const gyldigTilDato =
            gyldigTil.toLocaleDateString("nb-NO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "UTC"
            });

        document.getElementById("oppdatert").innerText =
            `Pølsestatus sist bekreftet ${bekreftetDato} kl. ${bekreftetTid}. Forventes gyldig til og med ${gyldigTilDato} kl. 23:59.`;
    }
}

function startPolseregn() {
    if (polseregnIntervall !== null) {
        return;
    }

    lagPolse();

    polseregnIntervall = setInterval(
        lagPolse,
        1200
    );
}

function stoppPolseregn() {
    if (polseregnIntervall !== null) {
        clearInterval(polseregnIntervall);
        polseregnIntervall = null;
    }

    document.querySelectorAll(".polse")
        .forEach(polse => polse.remove());
}

function lagPolse() {
    const polse = document.createElement("div");

    polse.className = "polse";
    polse.innerText = "🌭";

    polse.style.left = Math.random() * 90 + "vw";

    polse.style.fontSize =
        (2.5 + Math.random() * 1.5) + "rem";

    const varighet = 6 + Math.random() * 5;

    polse.style.animationDuration =
        varighet + "s";

    document.body.appendChild(polse);

    setTimeout(() => {
        polse.remove();
    }, varighet * 1000);
}

document.getElementById("behovKnapp")
    .addEventListener("click", meldBehov);

hentStatus();

// Oppdater telleren ved nytt døgn eller når siden
// blir aktiv igjen.
setInterval(() => {
    if (!document.getElementById("behovSeksjon")
        .classList.contains("hidden")) {
        hentBehov();
    }
}, 60000);
