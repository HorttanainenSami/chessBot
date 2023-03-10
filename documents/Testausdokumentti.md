# Testausdokumentti

- Testattu kaikki metodit jotka generoivat/tarkastavat mahdolliset siirrot jokaiselle palikalle. Testaus toteutettu antamalla raakadataa ja tehty olettamus mitä metodin pitäisi palauttaa ulos.
- Testaukset toteutettu Jest kirjastolla.
- Testaukset voidaan toistaa `npm test`-komennolla. Testaukset suoritetaan kuitenkin aina kun githubiin pusketaan dataa CI:n toimesta.



 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
|---------|----------|---------|---------|-------------------|
 |   95.62 |    84.19 |    94.9 |    96.7 |                   |
  |   97.05 |    52.38 |   85.71 |    96.9 |                   |
   |   97.05 |    52.38 |   85.71 |    96.9 | 6-15              |
  |     100 |      100 |     100 |     100 |                   |
   |     100 |      100 |     100 |     100 |                   |
  |   93.62 |    85.71 |    92.3 |   94.78 |                   |
   |    88.4 |    85.29 |   86.66 |   89.91 | 24-36,79-80       |
   |     100 |    86.11 |     100 |     100 | 135,182-185       |
  |   94.92 |    84.98 |   93.05 |   96.41 |                   |
   |   93.75 |    83.33 |     100 |     100 | 21,44             |
   |    92.1 |    82.85 |     100 |   92.59 | ...84-188,192-196 |
   |   92.74 |    77.77 |   84.61 |      95 | ...50-352,387-393 |
   |   95.95 |    47.36 |   88.88 |   96.84 | 7-16              |
   |   97.26 |    95.68 |     100 |    97.9 | ...88,445,601,648 |
   |   98.87 |    95.23 |     100 |     100 | 68                |


Alpha-Beta karsintaa testattu että toimii eri pelitilanteilla missä on matti tietyn siirtomäärän päässä.
Testattu 

|FEN|Matti x siirrolla|Haun syvyys|löytää matin|
|---|---|---|---|
|6k1/pp4p1/2p5/2bp4/8/P5Pb/1P3rrP/2BRRN1K b - - 0 3|3|4|K|
|1KB5/4N3/3pr1q1/R5nR/1B3kpQ/3pr1b1/5PP1/8 w - - 0 1| 3  |  3 | K  |
|b1B3Q1/5K2/5NP1/n7/2p2k1P/3pN2R/1B1P4/4qn2 w - - 0 1|  3 | 4  | K  |
|1k6/1P5Q/8/7B/8/5K2/8/8 b - - 0 1|  6 | 6  | K  |
|1k6/1P5Q/8/7B/8/5K2/8/8 b - - 0 1|  6 | 4  | E  |
|2b3R1/1p1Q2B1/1P3Pp1/R1PB2kN/6N1/7K/pppPppP1/8 w - - 0 1'|  3 | 4  | K  |
|'1rr2b2/8/2P1p3/Pp2P3/2PkpP2/pQ6/P3PPN1/2K5 w - - 0 1|  5 | 5  | K  |
|4Q3/pkp5/8/1PKN4/8/8/4B3/6B1 b - - 0 1|  4 | 4  | K  |
