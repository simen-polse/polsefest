const status = {
    polsefest: true,
    sted: "Narvesen",
    pris: "35"
};

if (status.polsefest) {
    document.body.className = "gronn";

    document.getElementById("status").innerText =
    "JA";

document.getElementById("info").innerText =
    `På ${status.sted}. ${status.pris} kr per pølse.`;
}
else {
    document.body.className = "rod";

    document.getElementById("status").innerText =
        "NEI";

    document.getElementById("info").innerText =
        "Dessverre, ingen pølsefest akkurat nå.";
}