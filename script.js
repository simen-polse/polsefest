const SUPABASE_URL = "https://ntwzzmnmbouclsoximwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_UZlebM4VdEBacdWpJAcbBg_6gb6vm2l";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function hentStatus() {

    const { data, error } = await supabaseClient
        .from("status")
        .select("*")
        .limit(1)
        .single();

    if (error) {

        console.error(
            "Klarte ikke å hente status:",
            error
        );

        document.body.className = "rod";

        document.getElementById("status").innerText =
            "NEI";

        document.getElementById("info").innerText =
            "Klarte ikke å sjekke pølsestatus akkurat nå.";

        return;
    }

    visStatus(data);
}


function visStatus(status) {

    if (status.polsefest) {

        document.body.className = "gronn";

        document.getElementById("status").innerText =
            "JA";

        document.getElementById("info").innerText =
            `På ${status.sted}. ${status.pris} kr per pølse.`;

        startPolseregn();

    } else {

        document.body.className = "rod";

        document.getElementById("status").innerText =
            "NEI";

        document.getElementById("info").innerText =
            status.melding ||
            "Dessverre, ingen pølsefest akkurat nå.";
    }


    if (status.oppdatert) {

        const dato =
            new Date(status.oppdatert);


        const bekreftetDato =
            dato.toLocaleDateString(
                "nb-NO",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );


        const bekreftetTid =
            dato.toLocaleTimeString(
                "nb-NO",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        const gyldigTil =
            new Date(dato);


        const ukedag =
            gyldigTil.getDay();


        const dagerTilSondag =
            ukedag === 0
                ? 0
                : 7 - ukedag;


        gyldigTil.setDate(
            gyldigTil.getDate() +
            dagerTilSondag
        );


        const gyldigTilDato =
            gyldigTil.toLocaleDateString(
                "nb-NO",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );


        document.getElementById("oppdatert").innerText =
            `Pølsestatus sist bekreftet ${bekreftetDato} kl. ${bekreftetTid}. Forventes gyldig til og med ${gyldigTilDato} kl. 23:59.`;
    }
}


function startPolseregn() {

    lagPolse();

    setInterval(() => {

        lagPolse();

    }, 1200);
}


function lagPolse() {

    const polse =
        document.createElement("div");


    polse.className =
        "polse";


    polse.innerText =
        "🌭";


    polse.style.left =
        Math.random() * 95 + "vw";


    polse.style.fontSize =
        (1.5 + Math.random() * 1.5) +
        "rem";


    const varighet =
        6 + Math.random() * 5;


    polse.style.animationDuration =
        varighet + "s";


    document.body.appendChild(
        polse
    );


    setTimeout(() => {

        polse.remove();

    }, varighet * 1000);
}


hentStatus();