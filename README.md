# Globitrans 

Create a complete, highly polished and fully functional enterprise web application for **GLOBITRANS**, a logistics and customs operations company.

The application must be designed as a professional internal business platform called:

# GLOBITRANS

## Bureau d’Ordre Digital des Mains Levées

The purpose of this application is to centralize, analyze, classify and track customs release documents ("Mains Levées") received by email and to organize their transmission between declarants and the Finance department.

This application replaces a previous automated invoicing concept.

IMPORTANT:

There must be **NO automatic invoice generation** in this version.

The objective is not to create invoices.

The objective is to create a reliable digital operational register that answers:

* Which customs release documents were received today?
* Which customer does each document belong to?
* Which declarant is responsible for the dossier?
* Which dossiers must still be submitted to Finance?
* Which dossiers have already been deposited?
* Which dossiers have actually been received by Finance?
* Which dossiers have anomalies or require manual validation?

The application must feel like a serious, formal and sophisticated enterprise software product.

---

# 1. GLOBAL PRODUCT VISION

Build a centralized digital workflow:

EMAIL REÇU
↓
DÉTECTION D’UNE MAIN LEVÉE
↓
OUVERTURE DE LA PIÈCE JOINTE
↓
LECTURE DU DOCUMENT
↓
LECTURE DU CODE RÉGIME – CASE 1
↓
APPLICATION DE LA RÈGLE CASE 2 / CASE 8
↓
IDENTIFICATION DU CLIENT
↓
IDENTIFICATION DU DÉCLARANT RESPONSABLE
↓
CRÉATION DU DOSSIER
↓
AJOUT À LA LISTE DU DÉCLARANT
↓
AJOUT À LA LISTE FINANCE
↓
DOSSIER DÉPOSÉ
↓
DOSSIER REÇU PAR FINANCE
↓
ARCHIVAGE ET TRAÇABILITÉ

The user must immediately understand where every dossier is within this workflow.

---

# 2. LANGUAGE

The complete user interface must be in **French**.

All of the following must be in French:

* Sidebar
* Page titles
* Buttons
* Search fields
* Statuses
* Forms
* Tables
* Notifications
* Tooltips
* Empty states
* Modals
* Filters
* Charts
* Authentication screens
* Error messages

The technical implementation can use English variable names.

---

# 3. DESIGN DIRECTION

The application must use a highly sophisticated, formal and professional design.

The visual identity should communicate:

* Reliability
* Control
* Traceability
* Logistics expertise
* Customs operations
* Administrative rigor
* Financial process control

Avoid:

* Playful SaaS design
* Excessive gradients
* Very rounded cartoon-style cards
* Neon colors
* Excessive animations
* Startup-looking illustrations
* Oversized KPI cards
* Visual clutter

The interface should resemble a premium enterprise management platform.

Think of the visual quality of:

* Modern ERP
* Modern customs management system
* High-end B2B SaaS
* Professional financial operations dashboard

---

# 4. DESIGN SYSTEM

Use the following premium palette:

## Main colors

Dark Navy:
#0B172A

Deep Blue:
#142B4A

Corporate Blue:
#205EA6

Accent Blue:
#3A7BC8

Soft Blue:
#EAF2FB

Background:
#F4F6F8

Cards:
#FFFFFF

Primary text:
#172033

Secondary text:
#667085

Border:
#E2E7EC

Success:
#16794F

Warning:
#B7791F

Danger:
#C2414A

Neutral:
#687385

---

Use:

* Inter
  or
* Manrope

Typography should be formal.

Titles should not be excessively large.

Examples:

Page title:
28–32px

Section title:
18–20px

Body:
14–15px

Tables:
13–14px

---

# 5. GLOBAL LAYOUT

Use a fixed desktop structure:

LEFT SIDEBAR
+
TOP HEADER
+
MAIN CONTENT AREA

Sidebar width:
Approximately 250px

Collapsed:
Approximately 72px

Main background:
#F4F6F8

Cards should use:

* White background
* 1px subtle border
* Minimal shadow
* 8–10px border radius

Avoid excessive floating cards.

Make tables central to the design.

This is a management system, therefore structured information must be prioritized over decoration.

---

# 6. SIDEBAR DESIGN

Create a dark navy vertical sidebar.

Top section:

GLOBITRANS logo placeholder

Text:

GLOBITRANS

Small text underneath:

Bureau d’Ordre Digital

Add a subtle divider.

Organize navigation in clearly named sections.

---

## PILOTAGE

Accueil

---

## OPÉRATIONS

Mains levées

Liste Finance

Mes dossiers

---

## AUTOMATISATION

Agent Email

---

## RÉFÉRENTIEL

Clients

Déclarants

Codes régimes

---

## ANALYSE

Rapports & Exports

---

## ADMINISTRATION

Utilisateurs

Paramètres

---

Each menu item must have:

* Lucide icon
* Label
* Active state
* Optional counter badge

Examples:

Mains levées
24

Liste Finance
9

Anomalies
3

---

At the bottom display:

User avatar

Name

Role

Dropdown:

* Mon profil
* Paramètres
* Se déconnecter

---

# 7. HEADER

Create a professional top header.

Left:

Breadcrumb navigation.

Example:

Bureau d’ordre / Mains levées

Center:

Global search.

Placeholder:

"Rechercher un dossier, un client, un déclarant..."

Right:

Agent status

Green dot

"Agent Email actif"

Notification icon

User avatar

---

# 8. LOGIN PAGE

Create a sophisticated enterprise login experience.

Use a split screen.

LEFT SIDE:

Dark navy background.

GLOBITRANS logo.

Large title:

**Bureau d’Ordre Digital**

Subtitle:

**Centralisez, identifiez et suivez vos dossiers de main levée jusqu’à leur réception par la Finance.**

Add a subtle abstract visual representing:

* Documents
* Email
* Customs workflow
* Data connections

The visual must remain elegant and corporate.

No cartoon illustration.

RIGHT SIDE:

White login area.

Title:

**Connexion**

Subtitle:

"Accédez à votre espace GLOBITRANS."

Fields:

Adresse email

Mot de passe

Checkbox:

Se souvenir de moi

Button:

Se connecter

Secondary link:

Mot de passe oublié ?

---

# 9. MOCK AUTHENTICATION

Create functional mock authentication.

Use localStorage.

Demo accounts:

## ADMINISTRATEUR

[admin@globitrans.demo](mailto:admin@globitrans.demo)

Password:
demo123

Role:
Administrateur

---

## FINANCE

[finance@globitrans.demo](mailto:finance@globitrans.demo)

Password:
demo123

Role:
Finance

---

## DÉCLARANT

[declarant@globitrans.demo](mailto:declarant@globitrans.demo)

Password:
demo123

Role:
Déclarant

---

Protect routes depending on role.

---

# 10. USER ROLES

Create three principal profiles.

---

## ADMINISTRATEUR

Full access.

Can:

* See all dossiers
* Manage clients
* Manage declarants
* Manage regime codes
* Resolve anomalies
* Edit extracted information
* Change assigned declarant
* Access email automation
* Access reports
* Manage users
* Access audit logs

---

## FINANCE

Can:

* View all released dossiers
* See dossiers waiting to be deposited
* See deposited dossiers
* Mark dossier as received
* Add Finance comments
* Export daily list
* Filter by declarant
* Filter by customer
* View document
* View dossier history

Finance cannot manage regime rules.

Finance cannot generate invoices.

---

## DÉCLARANT

Can:

* Access own dossiers only
* View Main Levée documents
* View customers
* See daily list
* Mark dossier as deposited
* Add operational comments
* Export own list

A declarant cannot:

* See another declarant’s dossiers
* Mark dossier "Reçu Finance"
* Modify customs rules

---

# 11. HOME PAGE

Page:

**Accueil**

Header:

Bonjour, Karim

Subtitle:

"Vue opérationnelle des mains levées et des dossiers à transmettre aujourd’hui."

Right:

Date

07 septembre 2026

Button:

Actualiser

---

# 12. HOME KPI CARDS

Create five compact KPI blocks.

Not oversized.

### Mains levées du jour

24

+6 depuis ce matin

---

### Clients identifiés

21

87,5 % automatiquement

---

### À déposer

9

Dossiers en attente

---

### Reçus par Finance

12

Dossiers réceptionnés

---

### À vérifier

3

Anomalies détectées

---

# 13. DAILY WORKFLOW

Create a central component:

**État du traitement aujourd’hui**

Display horizontally:

Emails détectés
48

↓

Mains levées
24

↓

Clients identifiés
21

↓

Dossiers affectés
21

↓

Déposés
15

↓

Reçus Finance
12

Each step must have:

* Icon
* Count
* Short label
* Status

Keep it minimal and sophisticated.

---

# 14. ATTENTION REQUIRED

Create a section:

**Points nécessitant une attention**

List anomalies in compact rows.

Example:

ML-2026-00944

Code régime non exploitable

09:42

Button:
Examiner

---

ML-2026-00947

Client non identifié

10:27

Button:
Examiner

---

ML-2026-00951

Aucun déclarant affecté

11:04

Button:
Examiner

---

# 15. RECENT ACTIVITY

Create:

**Activité récente**

Timeline:

15:14

Dossier ML-2026-00942 reçu par Finance.

14:23

Youssef El Amrani a déposé 3 dossiers.

13:52

Le client Maghreb Distribution a été identifié automatiquement.

12:41

4 nouvelles mains levées détectées.

---

# 16. MODULE MAINS LEVÉES

This is the main operational module.

Page title:

**Mains levées**

Subtitle:

"Répertoire centralisé des dossiers ayant obtenu leur main levée."

Top right buttons:

Synchroniser les emails

Ajouter manuellement

Exporter

---

# 17. MAIN LEVÉE TABS

Use tabs:

Toutes

Aujourd’hui

À déposer

Déposées

Reçues Finance

À vérifier

Display counter.

Example:

Toutes
124

Aujourd’hui
24

À déposer
9

Déposées
15

Reçues
12

À vérifier
3

---

# 18. FILTER BAR

Create a compact professional filter bar.

Search:

"Rechercher par référence, client..."

Filters:

Date

Client

Déclarant

Code régime

Source client

Statut

Réception Finance

Button:

Réinitialiser

---

# 19. MAIN LEVÉE TABLE

Columns:

Checkbox

Référence

Date / Heure

Client

Code régime

Source

Déclarant

Statut dossier

Dépôt

Réception Finance

Actions

---

Example row:

ML-2026-00942

07/09/2026
09:14

Atlas Industrie SARL

010

Case 8

Youssef El Amrani

Reçu Finance

Déposé
14:23

✓ Reçu
15:14

Menu

---

# 20. STATUS DESIGN

Use sophisticated small badges.

Nouveau

Blue-gray

Analyse en cours

Blue

Client identifié

Indigo

À déposer

Amber

Déposé

Dark blue

Reçu Finance

Green

À vérifier

Red / subtle warning

---

# 21. DOSSIER DETAIL PAGE

Do not open dossier details in a modal.

Create a dedicated page.

Example route:

/mains-levees/ML-2026-00942

Breadcrumb:

Mains levées / ML-2026-00942

---

Header:

ML-2026-00942

Badge:
Reçu Finance

Subtitle:

Déclaration DUM-2026-48592

Buttons:

Voir document

Modifier

Ajouter une note

More menu

---

# 22. DOSSIER DETAIL LAYOUT

Create tabs:

Vue générale

Document douanier

Email source

Historique

---

# 23. DOSSIER OVERVIEW

Use a structured 2-column enterprise layout.

LEFT SIDE:

Information douanière

Identification client

Déclarant

RIGHT SIDE:

Progression dossier

Réception Finance

Activity summary

---

# 24. CUSTOMS INFORMATION CARD

Title:

**Informations douanières**

Display using label/value rows.

Code régime

010

Libellé

Mise à la consommation directe

Numéro de déclaration

DUM-2026-48592

Date de main levée

07 septembre 2026

Case d’identification

Case 8

---

# 25. CUSTOMER IDENTIFICATION CARD

Title:

**Identification du client**

Extracted value:

ATLAS INDUSTRIE SARL

Matched customer:

Atlas Industrie SARL

Customer code:

CLI-0045

Identification source:

Case 8

Confidence:

97 %

Badge:

Identification automatique

Add progress bar for confidence.

If confidence is under 90%:

Display:

Validation requise

Button:

Confirmer le client

---

# 26. CUSTOMER IDENTIFICATION BUSINESS RULE

The logic is essential.

The system must:

1. Read **Case 1** from document.

2. Retrieve customs regime code.

3. Normalize code using 3 digits.

Example:

10 → 010

60 → 060

4. Check regime reference table.

5. Determine client identification source:

CASE_2

CASE_8

UNUSED

6. Extract company name.

7. Search client database.

8. Assign customer.

---

# 27. CUSTOMS REGIME MAPPING

Seed the application using these rules.

## CASE 2

060
061
680
069
070
700
072
074
075
751
752
077
770
771
772
078
079
086
681
682
761
762
763
764
765
766
767
768
769
856
866
002
005

---

## CASE 8

010
020
021
022
023
241
242
243
300
301
302
303
310
311
312
321
322
323
331
332
035
036
037
381
385
382
383
384
386
080
081
817
082
820
821
822
083
084
849
040
430
044
046
047
048
085
051
510
511
052
053
054
055
056
087
090
092
093
094
095
097
098
099
050
221
231
855
004
006
007

---

## NON UTILISÉS

003
008
009
800
900

---

Display:

108 codes configurés

33 codes Case 2

70 codes Case 8

5 codes non utilisés

---

# 28. DECLARANT ASSIGNMENT

Each client must have an assigned declarant.

Once a client is identified:

client
→ declarantId
→ automatically assign dossier

Display:

**Déclarant responsable**

Avatar

Youssef El Amrani

[y.elamrani@globitrans.demo](mailto:y.elamrani@globitrans.demo)

6 dossiers actifs

Badge:

Déclarant attitré

Small text:

"Affectation automatique selon le référentiel client."

Administrators can click:

Modifier l’affectation

---

# 29. DOSSIER PROGRESS

Create sophisticated vertical stepper.

Title:

**Avancement du dossier**

Main levée reçue
✓
09:12

Document analysé
✓
09:13

Client identifié
✓
09:14

Déclarant affecté
✓
09:14

Dossier déposé
✓
14:23

Réception Finance
✓
15:14

Pending steps must remain gray.

---

# 30. RECEPTION FINANCE

Create a prominent but elegant card.

Title:

**Réception Finance**

State:

Dossier reçu

Display:

Déposé par

Youssef El Amrani

Date de dépôt

07/09/2026 à 14:23

Reçu par

Sara Benali

Date de réception

07/09/2026 à 15:14

Finance note:

"Dossier complet."

---

If not received:

Show large checkbox:

☐ Dossier reçu par la Finance

Button:

Confirmer la réception

---

# 31. CONFIRM RECEPTION MODAL

Title:

**Confirmer la réception du dossier**

Text:

"Vous êtes sur le point de confirmer la réception du dossier ML-2026-00942."

Display:

Client:
Atlas Industrie SARL

Déclarant:
Youssef El Amrani

Date de dépôt:
07/09/2026 – 14:23

Field:

Commentaire Finance

Buttons:

Annuler

Confirmer la réception

After confirmation:

Set:

receivedByFinance = true

receivedAtFinance = current date

receivedBy = current user

status = FINANCE_RECEIVED

Create history entry.

---

# 32. DOCUMENT VIEWER

Tab:

**Document douanier**

Use 60/40 layout.

LEFT:

Document preview.

Simulate a professional PDF viewer.

Controls:

Page previous

Page next

Zoom

Download

Open fullscreen

---

RIGHT:

Panel:

**Données extraites**

Case 1

010

Case 2

EXPORT MAROC SA

Case 8

ATLAS INDUSTRIE SARL

Déclaration

DUM-2026-48592

Date

07/09/2026

Identification retenue

Case 8

Customer

Atlas Industrie SARL

Confidence

97%

Highlight the selected Case.

---

# 33. EMAIL MODULE

Sidebar:

**Agent Email**

Header:

Agent Email

Subtitle:

"Détection et analyse automatique des emails relatifs aux mains levées."

Status panel:

● Agent opérationnel

Adresse surveillée:

[operations@globitrans.demo](mailto:operations@globitrans.demo)

Dernière synchronisation:

07/09/2026 – 15:32

Next sync:

15:37

Button:

Synchroniser maintenant

---

# 34. EMAIL KPI

Emails reçus

48

Mains levées détectées

24

Ignorés

22

À vérifier

2

---

# 35. EMAIL TABLE

Columns:

Heure

Expéditeur

Objet

Pièce jointe

Classification

Confiance

Dossier

Statut

Actions

Example:

09:12

[notifications@douane.mock](mailto:notifications@douane.mock)

Main levée – DUM 2026/48592

ML_48592.pdf

Main levée

98%

ML-2026-00942

Traité

---

# 36. EMAIL DETAIL

Create a professional email viewer.

Header:

From

To

Subject

Received date

Then email content.

Attachment card:

ML_DUM_48592.pdf

PDF – 482 KB

Button:

Ouvrir

---

Right side:

**Analyse Agent Email**

Classification

Main levée

Confidence

98%

Attachment detected

Oui

Code régime

010

Customer source

Case 8

Customer

Atlas Industrie SARL

Declarant

Youssef El Amrani

Dossier generated

ML-2026-00942

---

# 37. EMAIL PROCESS VISUALIZATION

Show technical workflow:

Email détecté
✓

Classification
✓

Pièce jointe
✓

Lecture document
✓

Code régime
✓

Client
✓

Déclarant
✓

Dossier créé
✓

---

# 38. SIMULATED EMAIL SYNC

The button:

**Synchroniser maintenant**

must work.

On click:

show spinner.

Text:

"Analyse des nouveaux emails..."

Then after simulation:

Toast:

"Synchronisation terminée."

Secondary message:

"3 emails analysés – 2 mains levées détectées."

Optionally add mock new records.

---

# 39. CLIENTS MODULE

Page:

**Clients**

Subtitle:

"Référentiel des clients et attribution des déclarants."

Actions:

Nouveau client

Importer

Exporter

---

# 40. CLIENT TABLE

Columns:

Code client

Raison sociale

ICE

Déclarant attitré

Mains levées du mois

En attente Finance

Statut

Actions

---

# 41. CLIENT DETAIL

Dedicated page.

Header:

Atlas Industrie SARL

CLI-0045

Active badge

Tabs:

Informations

Dossiers

Identification

Historique

---

# 42. CLIENT INFORMATION

Display:

Raison sociale

Atlas Industrie SARL

ICE

001234567890123

Email

[contact@atlas.demo](mailto:contact@atlas.demo)

Téléphone

+212 5 XX XX XX XX

Déclarant

Youssef El Amrani

---

# 43. CLIENT ALIASES

Create section:

**Noms et alias d’identification**

This is important for matching extracted customs documents.

Examples:

ATLAS INDUSTRIE SARL

ATLAS INDUSTRIE

ATLAS INDUSTRIE S.A.R.L.

ATLAS IND.

Button:

Ajouter un alias

---

# 44. CUSTOMER MATCHING SIMULATION

Normalize extracted names.

Ignore:

Case

Extra spaces

Punctuation

SARL

S.A.R.L.

SA

SARL AU

Common legal suffix variations

---

Match confidence:

90–100%

Identification automatique

70–89%

À confirmer

Below 70%

Non identifié

---

# 45. CLIENT CREATION

Functional modal or drawer.

Fields:

Code client

Raison sociale

ICE

Email

Téléphone

Déclarant attitré

Aliases

Status

Buttons:

Annuler

Créer le client

Persist with localStorage.

---

# 46. DECLARANTS MODULE

Page:

**Déclarants**

Subtitle:

"Gestion des déclarants et de leurs portefeuilles clients."

Table:

Déclarant

Clients attribués

Dossiers aujourd’hui

À déposer

Déposés

Reçus Finance

Statut

---

# 47. DECLARANT DETAIL

Header:

Youssef El Amrani

Declarant

Tabs:

Vue générale

Clients

Dossiers

Historique

KPI:

Clients attribués
12

Dossiers du jour
8

À déposer
3

Déposés
5

---

# 48. DECLARANT DAILY LIST

Page:

**Mes dossiers**

Available to declarants.

Title:

Mes dossiers du jour

Subtitle:

"Dossiers ayant obtenu leur main levée et devant être transmis au département Finance."

KPIs:

Dossiers
8

À déposer
3

Déposés
5

Reçus Finance
4

---

# 49. DECLARANT TABLE

Reference

Main levée

Client

Regime

Document

Dépôt

Finance

Actions

---

Declarant can click:

**Marquer comme déposé**

Confirmation modal:

"Confirmez-vous avoir déposé ce dossier auprès du département Finance ?"

After confirmation:

deposited = true

depositedAt = current timestamp

depositedBy = current user

status = DEPOSITED

---

# 50. FINANCE MODULE

Page:

**Liste Finance**

This must be one of the strongest screens.

Header:

Dossiers à réceptionner

Subtitle:

"Liste consolidée des dossiers clôturés transmis au département Finance."

---

Top date:

Aujourd’hui
07 septembre 2026

Date picker.

---

# 51. FINANCE KPI

Dossiers clôturés

24

À déposer

9

Déposés

15

Reçus

12

À réceptionner

3

---

# 52. FINANCE TABLE

Columns:

Référence

Date ML

Client

Régime

Déclarant

Document

Dépôt

Heure dépôt

Reçu

Heure réception

Commentaire

Actions

---

The "Reçu" column must be very visible.

Example:

☑ Reçu

or

☐ Non reçu

Finance user can click the checkbox.

---

# 53. FINANCE FILTERS

Filters:

Date

Déclarant

Client

Régime

Déposé / Non déposé

Reçu / Non reçu

Search

---

# 54. FINANCE BULK ACTION

Allow multiple selection.

When dossiers selected:

Display bulk action toolbar.

Example:

5 dossiers sélectionnés

Button:

Marquer comme reçus

Button:

Exporter

---

# 55. DAILY SUMMARY

Create:

**Récapitulatif du jour**

Example:

07 septembre 2026

24 mains levées

15 dossiers déposés

12 dossiers reçus

9 dossiers à déposer

3 dossiers déposés en attente de réception

---

Group by declarant.

Youssef El Amrani

8 dossiers

5 déposés

4 reçus

Amine Berrada

7 dossiers

6 déposés

5 reçus

---

Buttons:

Exporter Excel

Exporter CSV

Imprimer

Simuler l’envoi

---

# 56. CUSTOMS REGIME MODULE

Page:

**Codes régimes**

Header:

"Référentiel des règles d’identification client."

KPI:

108
Codes

33
Case 2

70
Case 8

5
Non utilisés

---

Table:

Code

Libellé

Catégorie

Source d’identification

Statut

Updated date

Actions

---

# 57. EDIT REGIME RULE

Admin can edit:

Case 2

Case 8

Non utilisé

Show confirmation:

**Modifier la règle d’identification ?**

"Cette modification sera appliquée aux prochaines analyses."

---

# 58. ANOMALY MANAGEMENT

Anomalies must be clearly handled.

Types:

CLIENT_NOT_FOUND

MULTIPLE_MATCHES

UNKNOWN_REGIME

UNUSED_REGIME

DOCUMENT_UNREADABLE

DECLARANT_NOT_ASSIGNED

EMAIL_CLASSIFICATION_UNCERTAIN

---

# 59. ANOMALY SCREEN

Inside Mains Levées:

Tab:

**À vérifier**

Display reason column.

Example:

ML-2026-00944

Regime 003

Code régime non utilisé

Button:

Résoudre

---

# 60. MANUAL RESOLUTION

Open a side drawer.

Title:

Résolution du dossier

Display extracted information.

Client extrait:

ABC INDUSTRIES

Suggested matches:

ABC Industrie SARL
82%

ABC Maroc
72%

Actions:

Sélectionner

Search manually

Créer un client

Button:

Valider l’identification

---

# 61. HISTORY

Every dossier must contain a complete audit trail.

Use professional vertical timeline.

Examples:

09:12

Email reçu.

09:13

Main levée identifiée.

09:13

Document ML_DUM_48592.pdf ouvert.

09:14

Code régime 010 détecté.

09:14

Règle Case 8 appliquée.

09:14

Atlas Industrie SARL identifié avec 97 % de confiance.

09:14

Youssef El Amrani affecté.

14:23

Dossier déposé à la Finance.

15:14

Réception confirmée par Sara Benali.

---

# 62. REPORTS

Page:

**Rapports & Exports**

Create operational reports.

NOT financial billing reports.

Filters:

Aujourd’hui

Cette semaine

Ce mois

Période personnalisée

---

Sections:

Volume de mains levées

Dossiers par déclarant

Dossiers par client

Taux de dépôt

Taux de réception Finance

Anomalies

---

# 63. CHARTS

Create simple, sophisticated charts.

Do not overload.

Charts:

Mains levées par jour

Dépôt / Réception

Dossiers par déclarant

Anomalies par type

Use muted corporate colors.

---

# 64. EXPORT

Export functions must work.

CSV export client-side.

Buttons:

Exporter

Options:

Excel

CSV

Imprimer

---

Finance export columns:

Date

Référence

Client

Code régime

Source identification

Déclarant

Déposé

Date dépôt

Reçu

Date réception

---

# 65. NOTIFICATIONS CENTER

Bell icon.

Notifications:

3 nouvelles mains levées détectées

2 dossiers nécessitent une validation

4 dossiers déposés par Youssef El Amrani

3 dossiers restent à réceptionner

Allow mark as read.

---

# 66. SETTINGS

Page:

**Paramètres**

Tabs:

Agent Email

Identification

Notifications

Utilisateurs

Sécurité

Données de démonstration

---

# 67. EMAIL SETTINGS

Agent actif

Email surveillé

Intervalle de synchronisation

Expéditeurs autorisés

Keywords:

main levée

main levee

douane

DUM

bon à enlever

Formats autorisés:

PDF

JPG

PNG

---

# 68. IDENTIFICATION SETTINGS

Automatic matching threshold:

90%

Manual validation threshold:

70%

Switch:

Normaliser les raisons sociales

Switch:

Ignorer les suffixes juridiques

Switch:

Utiliser les alias clients

---

# 69. MOCK DATA

Create rich realistic demo data.

At least:

12 clients

5 declarants

3 Finance users

1 admin

30 emails

24+ mains levées

108 regime codes

30+ audit entries

Multiple notifications

Multiple anomalies

---

# 70. MOCK DECLARANTS

Youssef El Amrani

Amine Berrada

Mehdi Alaoui

Salma Idrissi

Omar Bennani

---

# 71. MOCK CLIENTS

Use fictional companies.

Atlas Industrie SARL

Maghreb Distribution SA

Nova Textile Maroc

Horizon Automotive

Delta Packaging Maroc

Atlas Components

Mediterranea Trading

Green Supply Morocco

Technometal Industries

Casablanca Équipements

North Africa Logistics

Maroc Process Industries

---

# 72. EXAMPLE DOSSIER – CASE 8

ML-2026-00942

Code:
010

Case 2:
EXPORT MAROC SA

Case 8:
ATLAS INDUSTRIE SARL

Identification rule:
CASE_8

Selected customer:

Atlas Industrie SARL

Confidence:

97%

Declarant:

Youssef El Amrani

Deposited:
true

Finance received:
true

---

# 73. EXAMPLE DOSSIER – CASE 2

ML-2026-00943

Code:
060

Case 2:
NOVA TEXTILE MAROC

Case 8:
DESTINATION EUROPE SAS

Identification rule:
CASE_2

Selected customer:

Nova Textile Maroc

Confidence:

98%

Declarant:

Amine Berrada

Status:

À déposer

---

# 74. EXAMPLE ANOMALY

ML-2026-00944

Code:
003

Rule:
UNUSED

Status:
À vérifier

Message:

"Le code régime 003 est configuré comme non utilisé pour l’identification automatique du client."

---

# 75. GLOBAL SEARCH

Search must work.

Search across:

Dossiers

Clients

Déclarants

Emails

Results grouped.

Example:

### DOSSIERS

ML-2026-00942
Atlas Industrie SARL

### CLIENTS

CLI-0045
Atlas Industrie SARL

### DÉCLARANTS

Youssef El Amrani

---

# 76. FUNCTIONAL REQUIREMENTS

This MUST NOT be only a static UI mockup.

Implement real frontend functionality.

Use mock services and localStorage.

All major buttons must work.

Implement:

Login

Logout

Protected routes

Role-based navigation

Search

Filters

Sorting

Pagination

Tabs

Client CRUD

Declarant assignment

Customer identification validation

Dossier editing

Mark deposited

Mark Finance received

Reverse reception with confirmation

Add comments

Activity logs

Email synchronization simulation

Anomaly resolution

CSV export

Notifications

Date filters

Global search

Regime rule editing

Reset demo data

---

# 77. TECHNICAL STRUCTURE

Use:

React

TypeScript

Tailwind CSS

shadcn/ui

Lucide React

React Router

LocalStorage

Reusable hooks

Reusable components

---

Create a clear folder structure:

components/

pages/

features/

services/

data/

types/

hooks/

utils/

---

# 78. BUSINESS SERVICES

Create service functions:

processIncomingEmail()

classifyEmail()

extractDocumentData()

normalizeRegimeCode()

getRegimeRule()

normalizeCompanyName()

identifyCustomer()

assignDeclarant()

createMainLevee()

markAsDeposited()

markAsFinanceReceived()

resolveAnomaly()

generateFinanceDailyList()

generateDeclarantDailyList()

exportCSV()

---

# 79. MAIN DATA MODELS

## User

id

firstName

lastName

email

password

role

avatar

active

---

## Client

id

code

companyName

aliases

ice

email

phone

declarantId

active

createdAt

updatedAt

---

## Declarant

id

firstName

lastName

email

phone

avatar

active

---

## CustomsRegime

code

label

category

identificationSource

---

## EmailRecord

id

sender

recipient

subject

body

receivedAt

attachments

classification

confidence

status

mainLeveeId

---

## MainLevee

id

reference

emailId

receivedAt

releaseDate

declarationNumber

attachmentName

regimeCode

regimeLabel

case2Value

case8Value

identificationSource

extractedCustomerName

clientId

matchingConfidence

declarantId

status

deposited

depositedAt

depositedBy

receivedByFinance

receivedAtFinance

receivedBy

financeNote

notes

history

---

# 80. MAIN STATUS

Use:

NEW

ANALYZING

CLIENT_IDENTIFIED

REVIEW_REQUIRED

TO_DEPOSIT

DEPOSITED

FINANCE_RECEIVED

Display:

Nouveau

Analyse en cours

Client identifié

À vérifier

À déposer

Déposé

Reçu Finance

---

# 81. FORMAL UI DETAILS

Use:

Subtle separators

Sticky table headers

Dense data layout

Consistent alignment

Monospace font for:

* Dossier references
* Regime codes
* Declaration numbers

Example:

ML-2026-00942

010

DUM-2026-48592

Use tooltips where relevant.

Tables should have hover states.

Avoid excessive animations.

Transitions:

150–200ms.

---

# 82. EMPTY STATES

Finance:

**Aucun dossier à réceptionner**

"Tous les dossiers déposés ont été réceptionnés."

---

Declarant:

**Aucun dossier à déposer**

"Tous vos dossiers du jour ont été transmis à la Finance."

---

Email:

**Aucun nouvel email**

"L’Agent Email est à jour."

---

# 83. LOADING STATES

Create skeleton states for:

Tables

KPI cards

Document loading

Email synchronization

Client matching

---

# 84. ERROR STATES

Example:

**Impossible d’analyser le document**

"Certaines informations du document n’ont pas pu être extraites."

Buttons:

Réessayer

Saisir manuellement

---

# 85. RESPONSIVENESS

Primary target:

Desktop 1440px

Support:

1280px

1024px

Tablet

Mobile can show simplified views but does not need every advanced table column simultaneously.

---

# 86. SECURITY VISUALS

Display subtle indication in settings:

Dernière connexion

Session active

Role

But do not implement advanced backend security.

This is frontend demo authentication.

---

# 87. CRITICAL BUSINESS RULE

The system is a:

**BUREAU D’ORDRE DIGITAL**

Not an invoicing application.

The process stops at:

**Réception du dossier par le département Finance.**

After that, the dossier can display:

"Prêt pour traitement Finance"

But no invoice should be generated.

---

# 88. KEY QUESTIONS THE PRODUCT MUST ANSWER

For Finance:

**Quels dossiers clôturés dois-je encore recevoir ?**

For Declarant:

**Quels dossiers dois-je encore déposer ?**

For Admin:

**Quels dossiers sont bloqués ou nécessitent une intervention ?**

For Operations:

**Quelle est la situation de chaque main levée ?**

These questions should be answerable immediately from the interface.

---

# 89. FINAL USER JOURNEY

Demonstrate this scenario:

1. Agent Email receives an email from Customs.

2. Email is automatically classified as a Main Levée.

3. Attached PDF is opened.

4. Case 1 contains regime 010.

5. System retrieves regime rule.

6. Regime 010 uses Case 8.

7. Case 8 contains ATLAS INDUSTRIE SARL.

8. System matches Atlas Industrie SARL at 97%.

9. Client record shows Youssef El Amrani as assigned declarant.

10. Dossier ML-2026-00942 is created.

11. Dossier appears in Youssef's daily list.

12. Dossier appears in Finance consolidated list.

13. Youssef opens dossier and clicks:

"Marquer comme déposé"

14. Deposit timestamp is stored.

15. Finance receives dossier.

16. Finance checks:

"Reçu"

17. Reception timestamp and Finance user are stored.

18. Status changes:

"Reçu Finance"

19. Full operation appears in activity history.

---

# 90. FINAL ACCEPTANCE CRITERIA

The application must only be considered complete if:

* Login works
* Logout works
* Roles work
* Sidebar adapts by role
* Client module works
* Client CRUD works
* Declarant module works
* Agent Email module works
* Email synchronization simulation works
* Main Levée module works
* Document preview exists
* Regime Case 2/Case 8 rules work
* Customer matching works
* Declarant assignment works
* Anomalies can be resolved
* Daily declarant lists work
* Finance consolidated list works
* Deposit status works
* Finance reception checkbox works
* Timestamps are stored
* Audit history works
* Search works
* Filters work
* Export works
* Data persists using localStorage
* Mock data feels realistic
* UI looks sophisticated and enterprise-ready
* No automatic invoice is generated
* No billing creation workflow exists

FINAL EXPECTED RESULT:

Build a polished, credible, formal and highly professional operational web application that can be demonstrated to GLOBITRANS management as a realistic future internal tool for the management of customs release dossiers and their transmission to Finance.

The visual quality must be equivalent to a modern enterprise ERP / logistics SaaS platform rather than a basic Lovable prototype.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e4cbf8a4-9789-41db-bfa0-a0a18564a589).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
