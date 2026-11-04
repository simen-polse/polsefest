
const SUPABASE_URL =
    "https://ntwzzmnmbouclsoximwq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_UZlebM4VdEBacdWpJAcbBg_6gb6vm2l";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const LAGRINGSNOKKEL = "polsefest_dagens_behov";

let polseregnIntervall = null;
let aktivDato = norskDato();
let registreringPagar = false;


// NORSK DATO

function norskDato() {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}


// LOKAL LAGRING

function hentDagensRegistrering() {
    try {
        localStorage.removeItem("polsefest_besokende_id");
        localStorage.removeItem("polsefest_sist_meldt");

        const lagret =
            localStorage.getItem(LAGRINGSNOKKEL);

        if (!lagret) {
            return null;
        }

        const registrering = JSON.parse(lagret);

        if (
            registrering.dato !== norskDato() ||
            typeof registrering.id !== "string"
        ) {
            localStorage.removeItem(LAGRINGSNOKKEL);
            return null;
        }

        return registrering;

    } catch (error) {
        console.warn("Lokal lagring er utilgjengelig:", error);
        return null;
    }
}

function lagreRegistrering(registrering) {
    try {
        localStorage.setItem(
            LAGRINGSNOKKEL,
            JSON.stringify(registrering)
        );
        return true;
    } catch (error) {
        console.error("Kunne ikke lagre registrering:", error);
        return false;
    }
}


// KNAPP

function oppdaterKnapp() {
    if (registreringPagar) {
        return;
    }

    const knapp = document.getElementById("behovKnapp");
    const registrering = hentDagensRegistrering();

    if (registrering?.bekreftet) {
        knapp.disabled = true;
        knapp.innerText = "Behov meldt!";
    } else {
        knapp.disabled = false;
        knapp.innerText = registrering
            ? "Prøv igjen"
            : "Meld pølsefest-behov";
    }
}


// HENT DAGENS TELLER

async function hentBehov() {
    const datoVedStart = norskDato();
    const teller = document.getElementById("behovTeller");

    const { data, error } = await supabaseClient
        .rpc("hent_polsebehov");

    if (error) {
        console.error("Kunne ikke hente behov:", error);
        teller.innerText = "Kunne ikke hente dagens behov.";
        return;
    }

    if (datoVedStart !== norskDato()) {
        return;
    }

    teller.innerText = `Behov meldt i dag: ${data}`;
    oppdaterKnapp();
}


// MELD PØLSEFEST-BEHOV

async function meldBehov() {
    if (registreringPagar) {
        return;
    }

    const knapp = document.getElementById("behovKnapp");
    let registrering = hentDagensRegistrering();

    if (registrering?.bekreftet) {
        oppdaterKnapp();
        return;
    }

    const datoVedStart = norskDato();

    if (!registrering) {
        registrering = {
            dato: datoVedStart,
            id: crypto.randomUUID(),
            bekreftet: false
        };

        // Ikke send forespørsel hvis ID-en ikke
        // kan lagres. Da kan vi ikke garantere
        // samme ID ved nytt forsøk.
        if (!lagreRegistrering(registrering)) {
            knapp.innerText = "Lagring er utilgjengelig";
            knapp.disabled = true;
            return;
        }
    }

    registreringPagar = true;
    knapp.disabled = true;
    knapp.innerText = "Registrerer...";

    try {
        const { data, error } = await supabaseClient
            .rpc("meld_polsebehov", {
                p_besokende_id: registrering.id
            });

        if (error) {
            throw error;
        }

        const resultat = data[0];

        if (datoVedStart !== norskDato()) {
            hentDagensRegistrering();
            await hentBehov();
            return;
        }

        registrering.bekreftet = true;
        lagreRegistrering(registrering);

        document.getElementById("behovTeller").innerText =
            `Behov meldt i dag: ${resultat.totalt}`;

    } catch (error) {
        console.error("Kunne ikke melde behov:", error);

        // Den samme ID-en ligger fortsatt lagret.
        // Neste trykk prøver igjen med samme ID.

    } finally {
        registreringPagar = false;
        oppdaterKnapp();
    }
}


// HENT PØLSESTATUS

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


// VIS PØLSESTATUS

function visStatus(status) {
    const behovSeksjon =
        document.getElementById("behovSeksjon");

    if (status.polsefest) {
        document.body.className = "gronn";

        document.getElementById("status").innerText =
            "JA";

        document.getElementById("info").innerText =
            `På ${status.sted}. ${status.pris} kr per pølse.`;

        behovSeksjon.classList.add("hidden");
        startPolseregn();

    } else {
        document.body.className = "rod";

        document.getElementById("status").innerText =
            "NEI";

        document.getElementById("info").innerText =
            status.melding ||
            "Dessverre, ingen pølsefest akkurat nå.";

        stoppPolseregn();
        behovSeksjon.classList.remove("hidden");

        hentBehov();
    }

    visOppdatert(status.oppdatert);
}


// VIS OPPDATERT-LINJE

function visOppdatert(oppdatert) {
    if (!oppdatert) {
        return;
    }

    const dato = new Date(oppdatert);

    const bekreftetDato = dato.toLocaleDateString(
        "nb-NO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Europe/Oslo"
        }
    );

    const bekreftetTid = dato.toLocaleTimeString(
        "nb-NO",
        {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Oslo"
        }
    );

    const deler = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Europe/Oslo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).formatToParts(dato);

    const finn = type =>
        Number(deler.find(p => p.type === type).value);

    const gyldigTil = new Date(Date.UTC(
        finn("year"),
        finn("month") - 1,
        finn("day")
    ));

    const ukedag = gyldigTil.getUTCDay();

    const dagerTilSondag =
        ukedag === 0 ? 0 : 7 - ukedag;

    gyldigTil.setUTCDate(
        gyldigTil.getUTCDate() + dagerTilSondag
    );

    const gyldigTilDato =
        gyldigTil.toLocaleDateString(
            "nb-NO",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "UTC"
            }
        );

    document.getElementById("oppdatert").innerText =
        `Pølsestatus sist bekreftet ${bekreftetDato} kl. ${bekreftetTid}. Forventes gyldig til og med ${gyldigTilDato} kl. 23:59.`;
}


// PØLSEREGN

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

    polse.style.left =
        Math.random() * 90 + "vw";

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


// OPPSTART

hentDagensRegistrering();

document.getElementById("behovKnapp")
    .addEventListener("click", meldBehov);

hentStatus();


// OPPDATER VED NY DAG

setInterval(() => {
    const datoNa = norskDato();

    if (datoNa !== aktivDato) {
        aktivDato = datoNa;

        hentDagensRegistrering();
        oppdaterKnapp();
    }

    if (
        !document.getElementById("behovSeksjon")
            .classList.contains("hidden")
    ) {
        hentBehov();
    }
}, 60000);
