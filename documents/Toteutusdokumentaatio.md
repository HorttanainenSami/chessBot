# Toteutusdokumentaatio

Ohjelmassa toteutettu shakki moottori joka pelaa ihmistä vastaan. Moottori käyttää laskentaan Alpha-beta karsintaa parhaimman seuraavan siirron löytämiseksi. Alpha-Beta karsinta käyttää transposition taulukkoa välttämään laskemaan uudelleen jo käydyn pelitilanteen. Transposition taulukko tyhjennetään jokaisen toteutetun siirron jälkeen muistin yliuodon välttämiseksi. 

Heurastiikka arvioi pelitilanteen nappuloiden paikkojen, määrän, liikkuvuuden ja sotilaiden rakenteen perusteella ja palauttaa positiivisen arvon jos pelitilanne on valkoiselle edullinen ja negatiivisen jos pelitilanne on edullinen mustalle.

### Työn puutteet ja parannusehdotukset:
Ohjelmassa voisi tehostaa heurastiikkaa ottamaan paremmin huomioon kuninkaan turvallisuuden ja pelin eri vaiheet. Myös haun tehostaminen monella eri tekniikalla olisi suotavaa kuten uinuva haku (Quiescence search), siirtojen järjestäminen jolloin karsintaan päädytään useammin yms.

### Aikavaativuus
paras mahdollinen tilanne $O( \sqrt{ B^d })$, missä b = haarautuvuus ja d = syvyys

huonoin mahdollinen tilanne O( $B^d $)




Lähteet: https://www.chessprogramming.org/Main_Page
