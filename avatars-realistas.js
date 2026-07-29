// ================================================================
// Avatars realistas por género (SVG embutido) · sem rede
// ================================================================
(function () {
  "use strict";

  var FEMININOS = "maria,ana,isa,isabel,isabela,beatriz,bia,sofia,sophie,marta,carla,catarina,catia,lucia,luisa,patricia,paula,sandra,sonia,teresa,vanessa,vera,vitoria,yara,iara,rosa,rita,raquel,helena,elsa,elisa,elena,diana,daniela,debora,cristina,clara,celia,bruna,barbara,alice,adriana,fatima,fernanda,filipa,flavia,gabriela,graciela,ines,irene,joana,julia,juliana,lara,laura,leonor,lidia,liliana,lorena,luciana,madalena,manuela,margarida,marina,marisa,matilde,monica,nadia,natalia,nicole,olga,olivia,priscila,rebeca,renata,sara,silvia,simone,susana,tatiana,telma,valeria,viviane,yasmin,zara,nuria,nelma,neusa,noemia,otilia,pilar,ramona,salome,tania,ursula,virginia,wanda,zuleica,michele,andreia,angelica,benilde,celeste,conceicao,dulce,eduarda,eugenia,francisca,gloria,ivone,jacinta,leila,lurdes,lourdes,nair,nilza,odete,palmira,quelia,rosario,soraia,solange,vanda,amelia,augusta,belmira,carmo,dolores,esperanca,estrela,guilhermina,isaltina,josefa,lina,lurdes,mercedes,natercia,ofelia,perpetua,querubina,severina,teodora,urbana,violante,zelia".split(",");
  var MASCULINOS = "joao,jose,antonio,pedro,paulo,carlos,manuel,miguel,rui,ricardo,rodrigo,rafael,nuno,nelson,marco,marcos,luis,lucas,leonardo,leandro,jorge,hugo,henrique,gustavo,goncalo,francisco,fernando,felipe,filipe,fabio,eduardo,diogo,daniel,david,cristiano,bruno,bernardo,andre,alexandre,alberto,serafim,teodoro,zeferino,sebastiao,samuel,santiago,salvador,ruben,renato,raul,oscar,octavio,natan,nathan,moises,mateus,martin,martim,mario,lorenzo,leonel,kevin,julio,isaac,ivan,heitor,guilherme,gabriel,frederico,fabiano,elias,edson,eder,domingos,diego,dario,claudio,cesar,caio,brian,benjamin,arthur,artur,arnaldo,angelo,anderson,amilcar,amaro,alvaro,afonso,abel,ambrosio,anibal,baltazar,benedito,bonifacio,caetano,cipriano,constancio,cristovao,custodio,donizete,eleuterio,evaristo,faustino,florencio,gaspar,geraldo,helio,inocencio,jacinto,januario,joaquim,lindolfo,lourenco,luciano,marcelo,maximiano,norberto,onesimo,osvaldo,otavio,plinio,quirino,romulo,saturnino,silvestre,timoteo,ulisses,valdemar,vicente,wagner,xavier,zacarias,adilson,ademar,africo".split(",");

  function norm(nome) {
    return String(nome || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .split(/\s+/)[0] || "";
  }
  function hashName(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function detectarGenero(nome) {
    var n = norm(nome);
    if (!n) return "f";
    if (FEMININOS.indexOf(n) >= 0) return "f";
    if (MASCULINOS.indexOf(n) >= 0) return "m";
    if (n.endsWith("a") && ["guia","juda","luca","nicola"].indexOf(n) < 0) return "f";
    if (n.endsWith("o") || n.endsWith("son")) return "m";
    return hashName(n) % 2 === 0 ? "f" : "m";
  }

  var SKINS = ["#5C3310", "#6B3F24", "#8D5524", "#A analog".length && "#A67B5B", "#C68642"];
  SKINS = ["#5C3310", "#6B3F24", "#8D5524", "#A67B5B", "#C68642"];
  var HAIR_F = ["#1A120B", "#2C1A0E", "#3D2314", "#4A2912", "#0D0D0D"];
  var HAIR_M = ["#1A120B", "#2C1A0E", "#0D0D0D", "#3D2314"];

  function svgPortrait(genero, seed) {
    var skin = SKINS[seed % SKINS.length];
    var hair = (genero === "f" ? HAIR_F : HAIR_M)[seed % (genero === "f" ? HAIR_F.length : HAIR_M.length)];
    var bg = ["#F3F2EF", "#FBF6E9", "#ECE9E4", "#E8F0EC"][seed % 4];
    var lip = genero === "f" ? "#A65D5D" : "#8B5A4A";
    // slight feature offsets
    var eyeY = 46 + (seed % 3);
    var browY = eyeY - 6;

    var hairSvg;
    if (genero === "f") {
      // long / shoulder hair + volume
      var style = seed % 3;
      if (style === 0) {
        hairSvg =
          '<ellipse cx="50" cy="28" rx="34" ry="28" fill="' + hair + '"/>' +
          '<path d="M16 40 Q12 70 18 92 L28 92 Q22 60 24 42 Z" fill="' + hair + '"/>' +
          '<path d="M84 40 Q88 70 82 92 L72 92 Q78 60 76 42 Z" fill="' + hair + '"/>';
      } else if (style === 1) {
        hairSvg =
          '<path d="M18 48 Q20 18 50 14 Q80 18 82 48 Q80 36 50 34 Q20 36 18 48 Z" fill="' + hair + '"/>' +
          '<path d="M18 48 Q10 75 20 95 L32 90 Q24 65 28 48 Z" fill="' + hair + '"/>' +
          '<path d="M82 48 Q90 75 80 95 L68 90 Q76 65 72 48 Z" fill="' + hair + '"/>';
      } else {
        hairSvg =
          '<ellipse cx="50" cy="30" rx="32" ry="26" fill="' + hair + '"/>' +
          '<path d="M20 38 C14 55 16 80 22 96 L34 90 C28 70 30 50 32 40 Z" fill="' + hair + '"/>' +
          '<path d="M80 38 C86 55 84 80 78 96 L66 90 C72 70 70 50 68 40 Z" fill="' + hair + '"/>' +
          '<circle cx="50" cy="22" r="6" fill="' + hair + '"/>';
      }
    } else {
      var mstyle = seed % 3;
      if (mstyle === 0) {
        hairSvg = '<path d="M22 42 Q25 20 50 18 Q75 20 78 42 Q70 32 50 30 Q30 32 22 42 Z" fill="' + hair + '"/>';
      } else if (mstyle === 1) {
        hairSvg =
          '<path d="M20 44 Q22 18 50 16 Q78 18 80 44 Q72 28 50 28 Q28 28 20 44 Z" fill="' + hair + '"/>' +
          '<rect x="22" y="40" width="8" height="14" rx="3" fill="' + hair + '"/>' +
          '<rect x="70" y="40" width="8" height="14" rx="3" fill="' + hair + '"/>';
      } else {
        hairSvg = '<path d="M24 40 Q28 22 50 20 Q72 22 76 40 Q68 34 50 34 Q32 34 24 40 Z" fill="' + hair + '"/>';
      }
    }

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">' +
      '<rect width="100" height="100" fill="' + bg + '"/>' +
      hairSvg +
      // neck
      '<rect x="40" y="72" width="20" height="18" rx="4" fill="' + skin + '"/>' +
      // shoulders
      '<ellipse cx="50" cy="98" rx="36" ry="16" fill="' + (seed % 2 === 0 ? "#2A241E" : "#3D342C") + '"/>' +
      // face
      '<ellipse cx="50" cy="52" rx="24" ry="28" fill="' + skin + '"/>' +
      // ears
      '<ellipse cx="26" cy="52" rx="4" ry="6" fill="' + skin + '"/>' +
      '<ellipse cx="74" cy="52" rx="4" ry="6" fill="' + skin + '"/>' +
      // brows
      '<path d="M34 ' + browY + ' Q42 ' + (browY - 3) + ' 48 ' + browY + '" stroke="' + hair + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M52 ' + browY + ' Q58 ' + (browY - 3) + ' 66 ' + browY + '" stroke="' + hair + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      // eyes
      '<ellipse cx="40" cy="' + eyeY + '" rx="4.2" ry="4.5" fill="#fff"/>' +
      '<ellipse cx="60" cy="' + eyeY + '" rx="4.2" ry="4.5" fill="#fff"/>' +
      '<circle cx="40.5" cy="' + (eyeY + 0.5) + '" r="2.4" fill="#2A1810"/>' +
      '<circle cx="60.5" cy="' + (eyeY + 0.5) + '" r="2.4" fill="#2A1810"/>' +
      '<circle cx="41.2" cy="' + (eyeY - 0.3) + '" r="0.7" fill="#fff"/>' +
      '<circle cx="61.2" cy="' + (eyeY - 0.3) + '" r="0.7" fill="#fff"/>' +
      // nose
      '<path d="M50 48 L48 58 Q50 60 52 58 Z" fill="' + skin + '" stroke="#00000018" stroke-width="0.5"/>' +
      // lips
      (genero === "f"
        ? '<path d="M42 66 Q50 72 58 66 Q50 70 42 66 Z" fill="' + lip + '"/>'
        : '<path d="M44 66 Q50 70 56 66" stroke="' + lip + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>') +
      // soft cheek shade
      '<ellipse cx="34" cy="58" rx="5" ry="3" fill="#00000010"/>' +
      '<ellipse cx="66" cy="58" rx="5" ry="3" fill="#00000010"/>' +
      "</svg>";

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function avatarDataUrl(nome, generoForcado) {
    var g = generoForcado || detectarGenero(nome);
    var seed = hashName(norm(nome) || "x");
    return svgPortrait(g, seed);
  }

  function avatarImgHtml(nome, foto, extraClass) {
    var src = foto || avatarDataUrl(nome);
    return (
      '<div class="avatar bp-avatar-img ' + (extraClass || "") + '">' +
      '<img src="' + src + '" alt="" loading="lazy" decoding="async">' +
      "</div>"
    );
  }

  window.BPAvatars = {
    detectarGenero: detectarGenero,
    avatarDataUrl: avatarDataUrl,
    avatarImgHtml: avatarImgHtml
  };
})();
