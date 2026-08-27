const SUPABASE_URL = "https://ntwzzmnmbouclsoximwq.supabase.co";
const SUPABASE_KEY = "sb_publishable_UZlebM4VdEBacdWpJAcbBg_6gb6vm2l";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function hentStatus() {
    const { data, error } = await supabaseClient
        .from("status")
        .select("*")
        .limit(1)
        .single();

    if (error) {
        console.error("Klarte ikke å hente status:", error);

        document.body.className = "rod";
        document.getElementById("status").innerText = "NEI";
        document.getElementById("info").innerText =
            "Klarte ikke å sjekke pølsestatus akkurat nå.";

        return;
    }

    visStatus(data);
}

function visStatus(status) {
    if (status.polsefest) {
        document.body.className = "gronn";

        document.getElementById("status").innerText = "JA";

        document.getElementById("info").innerText =
            `På ${status.sted}. ${status.pris} kr per pølse.`;
    } else {
        document.body.className = "rod";

        document.getElementById("status").innerText = "NEI";

        document.getElementById("info").innerText =
            status.melding || "Dessverre, ingen pølsefest akkurat nå.";
    }
   if (status.oppdatert) {
    const dato = new Date(status.oppdatert);

    // Formater tidspunktet statusen ble bekreftet
    const bekreftetDato = dato.toLocaleDateString("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const bekreftetTid = dato.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit"
    });

    // Finn søndag i samme uke
    const gyldigTil = new Date(dato);

    const ukedag = gyldigTil.getDay(); // 0 = søndag
    const dagerTilSondag = ukedag === 0 ? 0 : 7 - ukedag;

    gyldigTil.setDate(gyldigTil.getDate() + dagerTilSondag);

    const gyldigTilDato = gyldigTil.toLocaleDateString("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    document.getElementById("oppdatert").innerText =
        `Pølsestatus sist bekreftet ${bekreftetDato} kl. ${bekreftetTid}. Forventes gyldig til og med ${gyldigTilDato} kl. 23:59.`;
}
}

hentStatus();