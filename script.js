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

    const formatert =
        dato.toLocaleString("nb-NO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    document.getElementById("oppdatert").innerText =
        `Pølsestatus sist bekreftet ${formatert}`;
}
}

hentStatus();