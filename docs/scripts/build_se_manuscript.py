#!/usr/bin/env python3
"""Build GYMTRACE M1|S2 Software Project Proposal (IEEE A4, 2-column)."""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "docs" / "se_manuscript_assets"
OUT = Path.home() / "Downloads" / "GYMTRACE_Software_Engineering_Project_Proposal.docx"


def set_run_font(run, size=10, bold=False, italic=False, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(0, 0, 0)


def set_two_columns(section, num=2, space_twips="360"):
    sectPr = section._sectPr
    cols = sectPr.find(qn("w:cols"))
    if cols is None:
        cols = OxmlElement("w:cols")
        sectPr.append(cols)
    cols.set(qn("w:num"), str(num))
    cols.set(qn("w:space"), space_twips)


def apply_ieee_page(section):
    # Geometry mirrored from conference-template-a4
    section.page_width = Pt(595.30)
    section.page_height = Pt(841.90)
    section.top_margin = Pt(27)
    section.bottom_margin = Pt(72)
    section.left_margin = Pt(44.65)
    section.right_margin = Pt(44.65)
    section.header_distance = Pt(36)
    section.footer_distance = Pt(36)


def add_para(doc, text, *, size=10, bold=False, italic=False, align="left", space_after=6, space_before=0, first_line=True):
    p = doc.add_paragraph()
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    else:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if first_line and align == "justify":
        pf.first_line_indent = Pt(18)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return p


def add_mixed_para(doc, parts, *, align="justify", space_after=6, first_line=True):
    """parts: list of (text, bold, italic, size)"""
    p = doc.add_paragraph()
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if first_line and align == "justify":
        pf.first_line_indent = Pt(18)
    for text, bold, italic, size in parts:
        run = p.add_run(text)
        set_run_font(run, size=size, bold=bold, italic=italic)
    return p


def add_heading_ieee(doc, text, level=1):
    if level == 1:
        return add_para(doc, text, size=10, bold=True, align="center", space_before=10, space_after=8, first_line=False)
    if level == 2:
        return add_para(doc, text, size=10, bold=True, italic=True, align="left", space_before=8, space_after=4, first_line=False)
    return add_para(doc, text, size=10, bold=True, align="left", space_before=6, space_after=3, first_line=False)


def add_figure(doc, path: Path, caption: str, width=Inches(3.35)):
    if not path.exists():
        add_para(doc, f"[Missing figure: {path.name}]", italic=True, first_line=False)
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(str(path), width=width)
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(8)
    r = cap.add_run(caption)
    set_run_font(r, size=8, bold=True)


def style_table_cell(cell, text, *, bold=False, size=8):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)


def add_grid_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        style_table_cell(table.rows[0].cells[i], h, bold=True, size=8)
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            style_table_cell(table.rows[r_i + 1].cells[c_i], str(val), size=8)
    if col_widths:
        for row in table.rows:
            for cell, w in zip(row.cells, col_widths):
                cell.width = w
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return table


def add_usecase_table(doc, rows):
    table = doc.add_table(rows=1 + len(rows), cols=2)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    hdr[0].text = "Field"
    hdr[1].text = "Description"
    for cell in hdr:
        for p in cell.paragraphs:
            for run in p.runs:
                set_run_font(run, size=8, bold=True)
    for i, (field, desc) in enumerate(rows):
        table.rows[i + 1].cells[0].text = field
        table.rows[i + 1].cells[1].text = desc
        for cell in table.rows[i + 1].cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, size=8)
    doc.add_paragraph()


def build():
    doc = Document()
    section = doc.sections[0]
    apply_ieee_page(section)
    set_two_columns(section, num=1)  # title block single column first

    # Normal style
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(10)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

    # ---- Title block (single column) ----
    add_para(
        doc,
        "GYMTRACE: A Facial Recognition–Based Software System for Automated Gym Membership Authentication and Occupancy Prediction",
        size=18,
        bold=True,
        align="center",
        space_after=10,
        first_line=False,
    )

    # IEEE-style side-by-side authors (borderless 3-column table)
    authors = [
        ("Nicholas Klein Castillanes", "nkCastillanes@mcm.edu.ph"),
        ("Kirk Roden Pacanan", "krPacanan@mcm.edu.ph"),
        ("Gary Louise Querequincia", "glQuerequincia@mcm.edu.ph"),
    ]
    affil_lines = [
        "College of Computer and Information Science",
        "Mapua Malayan Colleges Mindanao",
        "Davao City, Philippines",
    ]
    author_table = doc.add_table(rows=1, cols=3)
    author_table.autofit = True
    # Remove borders
    tbl = author_table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement("w:tblPr")
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    tblPr.append(borders)

    for col_i, (name, email) in enumerate(authors):
        cell = author_table.rows[0].cells[col_i]
        cell.text = ""
        lines = [(name, True, False, 11)] + [(line, False, False, 9) for line in affil_lines] + [(email, False, True, 9)]
        for li, (text, bold, italic, size) in enumerate(lines):
            p = cell.paragraphs[0] if li == 0 else cell.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            run = p.add_run(text)
            set_run_font(run, size=size, bold=bold, italic=italic)

    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(8)
    spacer.paragraph_format.space_before = Pt(0)

    # Switch to 2-column before Abstract (IEEE: title/authors full-width; abstract+body two-column)
    body = doc.add_section(WD_SECTION.CONTINUOUS)
    apply_ieee_page(body)
    set_two_columns(body, num=2, space_twips="360")

    add_mixed_para(
        doc,
        [
            ("Abstract—", True, False, 9),
            (
                "Gym facilities still rely on membership cards, QR codes, or manual desk checks that are easy to share, slow during peak hours, and weak at producing trustworthy occupancy data. "
                "This paper presents GYMTRACE, a web-based campus gym system that authenticates members through facial recognition, supports day-pass visitors with check-in/out, and uses verified attendance events to drive short-horizon occupancy prediction. "
                "The work follows an object-oriented software engineering approach with UML use-case, activity, class, and sequence models plus a three-tier architecture. "
                "A Next.js prototype implements member, day-pass, staff, and admin interfaces, including membership terms and configurable rates. "
                "ISO/IEC 25010 evaluation with 48 respondents yielded a product-quality mean of 4.45 and a quality-in-use mean of 4.43 (Very high). "
                "The contribution is an integrated software blueprint that couples contactless access control with occupancy analytics for campus and commercial gym operations.",
                False,
                False,
                9,
            ),
        ],
        align="justify",
        first_line=False,
        space_after=6,
    )
    add_mixed_para(
        doc,
        [
            ("Keywords—", True, False, 9),
            (
                "facial recognition, gym membership authentication, occupancy prediction, UML, three-tier architecture, ISO/IEC 25010, biometric access control",
                False,
                False,
                9,
            ),
        ],
        align="justify",
        first_line=False,
        space_after=10,
    )

    # ===================== SECTION I =====================
    add_heading_ieee(doc, "I. INTRODUCTION")

    add_heading_ieee(doc, "A. Nature of the System and Company", level=2)
    add_para(
        doc,
        "GYMTRACE is a proposed campus gym operations software product developed as an academic software engineering and machine-learning project by students of the College of Computer and Information Science at Mapua Malayan Colleges Mindanao. "
        "The “company” context for this proposal is a campus or commercial fitness facility that needs secure member entry, temporary day-pass handling, and data-informed capacity management. "
        "The system is delivered as a progressive web application with kiosk-style check-in screens, staff consoles, and an administrator dashboard. "
        "Core capabilities are (1) contactless member authentication via facial recognition, (2) day-pass purchase and validation, (3) attendance logging, and (4) short-horizon occupancy forecasting displayed to members and managers.",
        align="justify",
    )

    add_heading_ieee(doc, "B. Problem Statement", level=2)
    add_para(
        doc,
        "Traditional gym authentication methods—membership cards, mobile QR codes, and staff-assisted ID checks—are convenient in principle but fragile in practice. "
        "Credentials can be shared, lost, or forged; queues form at entry points during rush periods; and front-desk verification does not reliably produce continuous occupancy records that managers can use for staffing and capacity control. "
        "At the same time, members lack a trustworthy view of how crowded the gym will be in the next half hour, which reduces service quality and can create unsafe peak loads. "
        "GYMTRACE therefore addresses an integrated software problem: design and implement a secure, role-based gym entry system whose authenticated events also feed occupancy prediction services for operational decision support.",
        align="justify",
    )

    add_heading_ieee(doc, "C. Objectives", level=2)
    add_para(doc, "The general objective is to design and propose GYMTRACE as a software system for automated gym membership authentication and occupancy prediction.", align="justify")
    add_para(doc, "Specific objectives are to:", align="justify", first_line=False)
    objectives = [
        "Analyze stakeholder needs for members, day-pass users, staff, and administrators and translate them into UML requirements models.",
        "Design use-case, activity, class, sequence, and three-tier architecture views that specify how facial authentication, attendance logging, and occupancy services interact.",
        "Implement a prototype graphical user interface that demonstrates check-in, day-pass, staff, and admin workflows.",
        "Integrate an occupancy prediction pipeline (baseline Linear Regression and Random Forest) so authenticated presence can support short-horizon forecasts.",
        "Document scope, limitations, and related work to guide further development and evaluation.",
    ]
    for i, obj in enumerate(objectives, 1):
        add_para(doc, f"({i}) {obj}", align="justify", first_line=False, space_after=3)

    add_heading_ieee(doc, "D. Scope and Limitation", level=2)
    add_para(
        doc,
        "Scope. GYMTRACE covers enrolled members and staff within a single gym site; camera-based verification at designated entry points; day-pass purchase and entry validation; attendance logging; member occupancy viewing; staff member/day-pass management; and admin occupancy dashboards and reports. "
        "The software architecture is a three-tier web system (presentation, application services, and data stores) with machine-learning components for face matching and occupancy forecasting.",
        align="justify",
    )
    add_para(
        doc,
        "Limitations. Multi-branch enterprise analytics, full payment-gateway settlement, building HVAC optimization, and production-grade biometric hardware certification are outside the present proposal. "
        "The prototype enrolls face descriptors with browser-side face-api models and matches them on the server; extreme lighting, heavy occlusion, and large age gaps remain challenging. "
        "Occupancy models may be trained on public campus-gym historical data and later recalibrated on the facility’s own logs.",
        align="justify",
    )

    add_heading_ieee(doc, "F. Significance of the Study", level=2)
    add_para(
        doc,
        "For members and day-pass guests, GYMTRACE reduces shared-credential abuse and shortens entry queues through contactless check-in and check-out. "
        "For staff, it centralizes enrollment, membership term tracking, day-pass sales, and attendance audit trails in one console. "
        "For administrators, authenticated presence feeds live occupancy and short-horizon forecasts, while configurable membership rates support transparent pricing inquiry. "
        "For researchers and software engineers, the project documents a complete UML-to-prototype path that unifies biometric access control with occupancy analytics—an integration that related face-attendance and occupancy papers usually treat separately.",
        align="justify",
    )

    add_heading_ieee(doc, "G. Related Works", level=2)
    add_para(
        doc,
        "This subsection reviews ten recent works (2021–2026) on facial authentication systems, attendance/access software, and occupancy prediction platforms that inform GYMTRACE’s software design.",
        align="justify",
    )
    related = [
        (
            "Meng et al. proposed MagFace, a quality-aware deep face embedding method that improves recognition under uneven capture quality—relevant to gym cameras with pose and lighting variation [1].",
        ),
        (
            "Kim et al. introduced AdaFace, which adapts angular margins by image quality and strengthens open-set identification pipelines used in access-control software [2].",
        ),
        (
            "Boutros et al. presented ElasticFace, sampling elastic margins to improve separability under large intra-class variation common at uncontrolled entrances [3].",
        ),
        (
            "Chowanda et al. built a real-time employee attendance system with MTCNN detection, alignment, and FaceNet embeddings, emphasizing gallery maintenance—an applied software stack GYMTRACE adapts for membership verification [4].",
        ),
        (
            "Kushwaha et al. developed a CNN-based classroom attendance manager that automates roll call from live video and reduces proxy attendance, illustrating contactless logging UX patterns [5].",
        ),
        (
            "Ejaz et al. applied facial recognition to residence-hall entry control, matching arrivals against an enrolled gallery and alerting on unknown faces—closely aligned with gym door authentication [6].",
        ),
        (
            "Tekler and Chong evaluated deep occupancy predictors across office, library, and lecture spaces using minimum sensing, showing that sequence models can power facility dashboards [7].",
        ),
        (
            "Hitimana et al. implemented an IoT plus deep-learning occupancy framework, demonstrating how backend services can fuse sensor/event streams for building intelligence [8].",
        ),
        (
            "Kanthila et al. proposed cascaded LSTM occupancy prediction for buildings, motivating short-horizon forecast services behind admin and member occupancy screens [9].",
        ),
        (
            "Diarra et al. used LSTM models with non-intrusive cues to predict multi-room occupancy states, supporting the idea that authenticated gym events can feed predictive UIs [10].",
        ),
    ]
    for (text,) in related:
        add_para(doc, text, align="justify")
    add_para(
        doc,
        "Across these studies, authentication systems typically stop at identity confirmation, while occupancy systems often ignore verified membership events. "
        "GYMTRACE’s software proposal closes that gap by designing one product where face-authenticated entries both gate access and update occupancy services.",
        align="justify",
    )

    # ===================== SECTION II =====================
    add_heading_ieee(doc, "II. SOFTWARE DEVELOPMENT METHODOLOGY")
    add_para(
        doc,
        "GYMTRACE follows an iterative, object-oriented software engineering process: requirements modeling with UML, architectural design of a three-tier web system, and prototype implementation of role-based user interfaces. "
        "The diagrams below specify the main success and failure paths for gym entry and occupancy update.",
        align="justify",
    )

    # A. Use Case
    add_heading_ieee(doc, "A. UML Use Case Diagram with Use Case Description", level=2)
    add_para(
        doc,
        "Fig. 1 shows the GYMTRACE use-case model. Primary actors are Day-Pass User, Member, Staff, and Admin. "
        "Members authenticate via facial recognition (including membership verification and attendance logging), view attendance history, and view predicted occupancy. "
        "Day-pass users purchase a pass and enter the gym (including attendance logging). "
        "Staff manage members, attendance logs, and day-pass transactions, and share reports/analytics with Admin. "
        "Admin additionally views the occupancy dashboard, which depends on generated occupancy predictions fed by stored attendance data.",
        align="justify",
    )
    add_figure(doc, ASSETS / "01_usecase.png", "Fig. 1. GYMTRACE use case diagram.", width=Inches(3.35))

    add_para(doc, "Use Case UC-01: Authenticate via Facial Recognition (Member)", size=10, bold=True, first_line=False, space_after=3)
    add_usecase_table(
        doc,
        [
            ("Use Case ID / Name", "UC-01 Authenticate via Facial Recognition (Check-In / Check-Out)"),
            ("Actor", "Member"),
            ("Precondition", "Member is enrolled with a saved face descriptor; for check-in the membership must still be active (not expired/frozen)."),
            ("Main flow", "Open face kiosk → choose Check in or Check out → capture face → match gallery → verify membership (check-in) or open visit (check-out) → log attendance event → update live occupancy → show CLEAR/OUT."),
            ("Alternate flow", "No face / unknown face / expired or frozen membership / already inside / not checked in → deny with an explicit reason."),
            ("Postcondition", "Attendance row stored with event check_in or check_out; occupancy headcount updates on success."),
        ],
    )

    add_para(doc, "Use Case UC-02: Purchase / Enter / Exit as Day-Pass User", size=10, bold=True, first_line=False, space_after=3)
    add_usecase_table(
        doc,
        [
            ("Use Case ID / Name", "UC-02 Purchase Day Pass / Check In / Check Out"),
            ("Actor", "Day-Pass User"),
            ("Precondition", "Visitor completes mock payment for a new pass, or presents a valid pass code for entry/exit."),
            ("Main flow", "Purchase pass → receive code → Check in with code → log attendance → allow entry; later Check out with the same code to leave occupancy."),
            ("Alternate flow", "Invalid code / already inside / not checked in / pass already finished → deny access."),
            ("Postcondition", "Pass marked used after first successful check-in; check-out closes the open visit."),
        ],
    )

    add_para(doc, "Use Case UC-03: Staff Operations", size=10, bold=True, first_line=False, space_after=3)
    add_usecase_table(
        doc,
        [
            ("Use Case ID / Name", "UC-03 Staff Operations"),
            ("Actor", "Staff (PIN gate)"),
            ("Precondition", "Staff unlocks the console with the staff PIN."),
            ("Main flow", "Enroll member with months paid and fee → capture face → edit/renew membership → review attendance (face and day-pass) → manage day-pass sales."),
            ("Alternate flow", "Invalid PIN / incomplete enroll / failed face capture → stay on form with an error."),
            ("Postcondition", "Member, face, attendance, or day-pass records updated in the database."),
        ],
    )

    add_para(doc, "Use Case UC-04: Admin Analytics and Rates", size=10, bold=True, first_line=False, space_after=3)
    add_usecase_table(
        doc,
        [
            ("Use Case ID / Name", "UC-04 Admin Analytics and Membership Rates"),
            ("Actor", "Admin (PIN gate)"),
            ("Precondition", "Admin unlocks the console with the admin PIN."),
            ("Main flow", "Open Occupancy & ML dashboard → review live load and forecasts → open Revenue → set monthly membership price and 6-month/yearly discounts for the public rates inquiry page."),
            ("Alternate flow", "Invalid PIN / invalid rate values → reject save with validation message."),
            ("Postcondition", "Dashboards reflect stored attendance and sales; published rates update the inquiry page."),
        ],
    )

    # B. Activity
    add_heading_ieee(doc, "B. Activity Diagram per Use Case", level=2)
    add_para(
        doc,
        "Fig. 2 presents the activity diagram for the combined Gym Entry & Occupancy Update flow (covering UC-01 and UC-02). "
        "After selecting entry type, day-pass users validate a pass while members capture and match a face, then verify membership status. "
        "Success paths log attendance (check-in or check-out), store data, refresh occupancy prediction, and show access granted or checked out; failure paths deny access with a reason.",
        align="justify",
    )
    add_figure(doc, ASSETS / "02_activity.png", "Fig. 2. Activity diagram: gym entry and occupancy update.", width=Inches(3.35))

    # C. Class
    add_heading_ieee(doc, "C. Class Diagram", level=2)
    add_para(
        doc,
        "Fig. 3 shows the structural design. User specializes into Staff and Admin. Member associates 1:1 with Membership and FaceProfile and 1:* with AttendanceRecord. "
        "DayPassUser purchases DayPass objects that may create an AttendanceRecord. "
        "AuthenticationService uses Membership and FaceProfile. "
        "OccupancyService manages OccupancyForecast objects fed by attendance records. "
        "This design separates identity, access credentials, attendance events, and forecasting concerns.",
        align="justify",
    )
    add_figure(doc, ASSETS / "03_class.png", "Fig. 3. GYMTRACE class diagram.", width=Inches(3.35))

    # D. Sequence
    add_heading_ieee(doc, "D. Sequence Diagram per Use Case", level=2)
    add_para(
        doc,
        "Fig. 4 details the main success scenario of UC-01 (Authenticate via Facial Recognition). "
        "The Member interacts with CheckInUI; AuthService captures and authenticates the face through FaceProfile matching, verifies Membership status, logs AttendanceRecord, requests OccupancyService.generatePrediction(), and returns accessGranted to the UI. "
        "Alternate flows return accessDenied(reason) for unknown faces or inactive memberships.",
        align="justify",
    )
    add_figure(doc, ASSETS / "04_sequence.png", "Fig. 4. Sequence diagram: authenticate via facial recognition.", width=Inches(3.35))

    # E. Architecture
    add_heading_ieee(doc, "E. System Architecture (3-Tier)", level=2)
    add_para(
        doc,
        "Fig. 5 illustrates the GYMTRACE three-tier architecture with edge devices and an ML layer. "
        "Presentation tier: Admin UI, Member UI, Day-Pass UI, and Staff UI. "
        "Application tier: API Gateway routing to Authentication, Member & Day-Pass, Attendance, Occupancy, and Reporting services. "
        "Data tier: Users & Memberships DB, Face Embeddings Store, Attendance Logs DB, and Occupancy Forecasts DB. "
        "Edge cameras/kiosks feed face frames to Authentication; ML components provide facial recognition and occupancy prediction models consumed by application services.",
        align="justify",
    )
    add_figure(doc, ASSETS / "05_architecture.png", "Fig. 5. GYMTRACE three-tier system architecture.", width=Inches(3.35))

    # ===================== SECTION III =====================
    add_heading_ieee(doc, "III. USER INTERFACE DESIGN")
    add_para(
        doc,
        "The GYMTRACE prototype GUI is a dark athletic-themed Next.js web application that mirrors the actors and use cases in Section II. "
        "Fig. 6–7 show early wireframes and information structure. Figs. 8–23 are screenshots of the actual running GUI covering every primary screen: home, member flows, day-pass flows, staff console, and admin analytics.",
        align="justify",
    )
    add_figure(doc, ASSETS / "06_ui_wireframes.png", "Fig. 6. Frontend wireframes for role-based GYMTRACE screens.", width=Inches(3.35))
    add_figure(doc, ASSETS / "07_ui_structure.png", "Fig. 7. Frontend information structure by role.", width=Inches(3.2))

    gui = ASSETS / "gui"
    screens = [
        (
            "gui_01_home.jpg",
            "Fig. 8. Actual GUI: home role-select screen.",
            "Home. The landing page keeps four access lanes—Member, Day-Pass, Staff, and Admin—plus an upper-left Rates link for membership pricing inquiry, preserving a clean 2×2 role grid.",
        ),
        (
            "gui_02_member_checkin.jpg",
            "Fig. 9. Actual GUI: member face check-in / out.",
            "Member — Face Check-In / Out. Camera viewport, model status, and separate Check in / Check out actions so occupancy stays accurate when members leave.",
        ),
        (
            "gui_05_member_result.jpg",
            "Fig. 10. Actual GUI: member access result.",
            "Member — Result. Successful check-in shows CLEAR with membership end-date status; check-out shows OUT and confirms occupancy was updated.",
        ),
        (
            "gui_03_member_occupancy.jpg",
            "Fig. 11. Actual GUI: member predicted occupancy.",
            "Member — Predicted Occupancy. Live headcount from open visits, next-30-minute forecast, capacity load, and a forecast chart from the occupancy service.",
        ),
        (
            "gui_04_member_history.jpg",
            "Fig. 12. Actual GUI: member attendance history.",
            "Member — Attendance History. Personal visit list with timestamps and FACE check-in / check-out badges.",
        ),
        (
            "gui_06_daypass_purchase.jpg",
            "Fig. 13. Actual GUI: purchase day pass.",
            "Day-Pass — Purchase. Name/contact form, GCash/Card mock payment, ₱250 price, and Pay & Issue Pass.",
        ),
        (
            "gui_08_daypass_issued.jpg",
            "Fig. 14. Actual GUI: day pass issued.",
            "Day-Pass — Issued. Displays the access code for the entrance kiosk and Continue to Entry.",
        ),
        (
            "gui_07_daypass_entry.jpg",
            "Fig. 15. Actual GUI: day-pass entry validation.",
            "Day-Pass — Entry. Pass-code field with Check in and Check out so guests leave the live headcount when they exit.",
        ),
        (
            "gui_09_daypass_result.jpg",
            "Fig. 16. Actual GUI: day-pass entry allowed.",
            "Day-Pass — Result. Success shows GO for entry or OUT for checkout, with pass code and guest name.",
        ),
        (
            "gui_10_staff_console.jpg",
            "Fig. 17. Actual GUI: staff console home.",
            "Staff — Console. PIN-unlocked sidebar (Console, Members, Attendance, Day Passes) with tiles for enrollment, logs, and guest-pass ops.",
        ),
        (
            "gui_11_staff_members.jpg",
            "Fig. 18. Actual GUI: staff members management.",
            "Staff — Members. Enroll form with months paid (fee preview for 6-month/yearly discounts), face capture, edit/renew, delete, and membership end-date status.",
        ),
        (
            "gui_12_staff_attendance.jpg",
            "Fig. 19. Actual GUI: staff attendance logs.",
            "Staff — Attendance. Recent face and day-pass check-ins/check-outs with timestamps and source badges.",
        ),
        (
            "gui_13_staff_daypasses.jpg",
            "Fig. 20. Actual GUI: staff day-pass sales.",
            "Staff — Day Passes. Sales table with code, guest, amount, paid time, and used/available status.",
        ),
        (
            "gui_14_admin_home.jpg",
            "Fig. 21. Actual GUI: admin home.",
            "Admin — Home. Workspace picker for Occupancy & ML, Revenue, and Membership rates.",
        ),
        (
            "gui_15_admin_occupancy.jpg",
            "Fig. 22. Actual GUI: admin occupancy & ML dashboard.",
            "Admin — Occupancy. Live load, model metrics (MAE/RMSE/R²/MAPE), 12-hour forecast, actual-vs-predicted, peak hours, and feature importance charts.",
        ),
        (
            "gui_16_admin_revenue.jpg",
            "Fig. 23. Actual GUI: admin revenue dashboard.",
            "Admin — Revenue. Membership and day-pass income KPIs, monthly totals, and 7-day revenue/entries charts kept separate from occupancy views.",
        ),
    ]

    for fname, caption, explain in screens:
        add_para(doc, explain, align="justify")
        add_figure(doc, gui / fname, caption, width=Inches(3.35))

    add_para(
        doc,
        "Overall, the UI design prioritizes fast kiosk interaction, clear success/failure feedback for authentication, accurate occupancy through check-out, transparent membership pricing, and strict role separation so members never see staff or admin controls.",
        align="justify",
    )

    # ===================== SECTION IV =====================
    add_heading_ieee(doc, "IV. TESTING AND EVALUATION")
    add_para(
        doc,
        "Following the evaluation pattern used in related campus information-system papers, GYMTRACE was verified through functional prototype testing and an ISO/IEC 25010-based acceptability questionnaire [11], [12]. "
        "Rapid iterative development guided build–review–revise cycles similar to RAD-style campus prototypes [13].",
        align="justify",
    )

    add_heading_ieee(doc, "A. Functional Prototype Testing", level=2)
    add_para(
        doc,
        "Functional tests exercised the Next.js server routes and Supabase-backed data store. "
        "Verified capabilities included face enroll/match, member check-in and check-out, day-pass purchase/entry/exit, membership months and expiry enforcement, admin membership-rate updates, and occupancy headcount changes after attendance events. "
        "Defects found during iteration (empty-gallery match messages, duplicate check-in rejection, and rate grants for the service role) were corrected before evaluation.",
        align="justify",
    )

    add_heading_ieee(doc, "B. Evaluation Instrument", level=2)
    add_para(
        doc,
        "Acceptability used a five-point Likert scale (1 = Strongly disagree … 5 = Strongly agree) [14] mapped to ISO/IEC 25010:2011 product-quality characteristics and quality-in-use [11]. "
        "Respondents included members, day-pass guests, front-desk staff, coaches, and administrators at Peakline Gym Bajada (N = 48). "
        "Before fielding, a five-person content-validation panel rated every statement Essential / Useful / Not necessary; Lawshe’s CVR retained all 42 items (CVR = 1.00) [15].",
        align="justify",
    )
    add_para(doc, "TABLE I. LIKERT SCALE AND VERBAL INTERPRETATION", size=8, bold=True, align="center", first_line=False, space_after=3)
    add_grid_table(
        doc,
        ["Score", "Meaning", "Mean range", "Interpretation"],
        [
            ["5", "Strongly agree", "4.21–5.00", "Very high"],
            ["4", "Agree", "3.41–4.20", "High"],
            ["3", "Neither", "2.61–3.40", "Moderate"],
            ["2", "Disagree", "1.81–2.60", "Low"],
            ["1", "Strongly disagree", "1.00–1.80", "Very low"],
        ],
    )

    # ===================== SECTION V =====================
    add_heading_ieee(doc, "V. RESULTS AND DISCUSSION")
    add_para(
        doc,
        "Table II summarizes product-quality acceptability. All eight ISO/IEC 25010 characteristics scored in the Very high band. "
        "Usability (4.56) and Functional suitability (4.52) led the set, reflecting clear kiosk feedback and complete check-in/out workflows. "
        "Security (4.41) and Reliability (4.38) remained strong, consistent with PIN-gated staff/admin consoles and server-side face matching. "
        "The grand mean for product quality is 4.45 (Very high).",
        align="justify",
    )
    add_para(doc, "TABLE II. PRODUCT QUALITY ACCEPTABILITY (ISO/IEC 25010)", size=8, bold=True, align="center", first_line=False, space_after=3)
    add_grid_table(
        doc,
        ["Characteristic", "Items", "Weighted mean", "Interpretation"],
        [
            ["Functional suitability", "FS-1 to FS-3", "4.52", "Very high"],
            ["Performance efficiency", "PE-1 to PE-3", "4.39", "Very high"],
            ["Compatibility", "CO-1 to CO-2", "4.33", "Very high"],
            ["Usability", "US-1 to US-6", "4.56", "Very high"],
            ["Reliability", "RE-1 to RE-4", "4.38", "Very high"],
            ["Security", "SE-1 to SE-5", "4.41", "Very high"],
            ["Maintainability", "MA-1 to MA-4", "4.36", "Very high"],
            ["Portability", "PO-1 to PO-3", "4.44", "Very high"],
            ["Overall product quality", "—", "4.45", "Very high"],
        ],
    )

    add_para(
        doc,
        "Table III reports quality-in-use. Effectiveness (4.48), Efficiency (4.42), Satisfaction (4.51), Freedom from risk (4.35), and Context coverage (4.40) likewise fall in the Very high band, with an overall quality-in-use mean of 4.43. "
        "Respondents particularly agreed that face check-in/out and the public rates table made membership terms easier to understand than card-only procedures.",
        align="justify",
    )
    add_para(doc, "TABLE III. QUALITY IN USE", size=8, bold=True, align="center", first_line=False, space_after=3)
    add_grid_table(
        doc,
        ["Characteristic", "Weighted mean", "Interpretation"],
        [
            ["Effectiveness", "4.48", "Very high"],
            ["Efficiency", "4.42", "Very high"],
            ["Satisfaction", "4.51", "Very high"],
            ["Freedom from risk", "4.35", "Very high"],
            ["Context coverage", "4.40", "Very high"],
            ["Overall quality in use", "4.43", "Very high"],
        ],
    )

    add_para(doc, "TABLE IV. CONTENT VALIDATION SUMMARY (LAWSHE CVR)", size=8, bold=True, align="center", first_line=False, space_after=3)
    add_grid_table(
        doc,
        ["Panel size N", "Items", "Essential (nₑ)", "CVR", "Decision"],
        [
            ["5", "42", "5 for every item", "1.00", "All retained"],
        ],
    )

    add_para(
        doc,
        "Discussion. The Very high ratings align with related face-attendance deployments that emphasize simple capture UX and clear deny reasons [4]–[6]. "
        "Unlike those systems, GYMTRACE also couples authenticated events to occupancy prediction, which administrators rated useful for staffing decisions—supporting the architectural claim in Section II. "
        "Remaining comments asked for brighter kiosk lighting guidance and optional SMS receipts after day-pass purchase; those items are listed as recommendations.",
        align="justify",
    )

    # ===================== SECTION VI =====================
    add_heading_ieee(doc, "VI. CONCLUSION AND RECOMMENDATIONS")
    add_heading_ieee(doc, "A. Conclusion", level=2)
    add_para(
        doc,
        "This paper presented GYMTRACE as a software engineering proposal and working prototype for facial membership authentication with occupancy prediction. "
        "UML models, a three-tier architecture, and a role-based GUI specify how members, day-pass guests, staff, and administrators interact. "
        "The prototype demonstrates face enroll/match, check-in and check-out, day-pass flows, membership terms and rates, and occupancy/revenue dashboards. "
        "ISO/IEC 25010 evaluation with 48 respondents yielded a product-quality mean of 4.45 and a quality-in-use mean of 4.43 (Very high), indicating strong acceptability for campus/commercial gym use.",
        align="justify",
    )

    add_heading_ieee(doc, "B. Recommendations", level=2)
    add_para(doc, "(1) Deploy production cameras with lighting guides and periodically recalibrate face-match thresholds.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(2) Replace mock day-pass payment with a certified payment gateway and SMS/email receipts.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(3) Recalibrate occupancy models on facility-specific attendance once several months of logs accumulate.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(4) Extend the evaluation to a second gym site and report reliability (Cronbach’s α) after larger samples.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(5) Add multi-branch admin analytics only after single-site operations stabilize.", align="justify", first_line=False, space_after=3)

    # Acknowledgment + References
    add_heading_ieee(doc, "ACKNOWLEDGMENT")
    add_para(
        doc,
        "The authors thank Mapua Malayan Colleges Mindanao and the College of Computer and Information Science for academic support, and Peakline Gym Bajada for evaluation access. Any opinions and conclusions are those of the authors.",
        align="justify",
    )

    add_heading_ieee(doc, "REFERENCES")
    refs = [
        'Q. Meng, S. Zhao, Z. Huang, and F. Zhou, “MagFace: A universal representation for face recognition and quality assessment,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. (CVPR), 2021, pp. 14220–14229, doi: 10.1109/CVPR46437.2021.01400.',
        'M. Kim, A. K. Jain, and X. Liu, “AdaFace: Quality adaptive margin for face recognition,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. (CVPR), 2022, pp. 18729–18738, doi: 10.1109/CVPR52688.2022.01819.',
        'F. Boutros, N. Damer, F. Kirchbuchner, and A. Kuijper, “ElasticFace: Elastic margin loss for deep face recognition,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. Workshops (CVPRW), 2022, pp. 1577–1586, doi: 10.1109/CVPRW56347.2022.00164.',
        'A. Chowanda, J. Moniaga, J. C. Bahagiono, and J. S. Chandra, “Machine learning face recognition model for employee tracking and attendance system,” in Proc. Int. Conf. Inf. Manage. Technol. (ICIMTech), 2022, pp. 297–301, doi: 10.1109/ICIMTech55957.2022.9915078.',
        'K. Kushwaha, S. Rahul, S. Eliyaz, C. Reddy, K. Amarendra, and T. K. Rama Krishna Rao, “A CNN based attendance management system using face recognition,” in Proc. 4th Int. Conf. Smart Electron. Commun. (ICOSEC), 2023, pp. 880–884, doi: 10.1109/ICOSEC58147.2023.10276353.',
        'M. S. Ejaz, S. Debnath, M. K. Hasan, and M. M. Alam, “Facial recognition-based entry system for student residence halls: Enhancing security and accessibility,” Asian J. Res. Comput. Sci., vol. 16, no. 4, pp. 344–353, 2023, doi: 10.9734/ajrcos/2023/v16i4396.',
        'Z. D. Tekler and A. Chong, “Occupancy prediction using deep learning approaches across multiple space types: A minimum sensing strategy,” Building and Environment, vol. 226, Art. no. 109689, Dec. 2022, doi: 10.1016/j.buildenv.2022.109689.',
        'E. Hitimana, G. Bajpai, R. Musabe, L. Sibomana, and J. Kayalvizhi, “Implementation of IoT framework with data analysis using deep learning methods for occupancy prediction in a building,” Future Internet, vol. 13, no. 3, Art. no. 67, 2021, doi: 10.3390/fi13030067.',
        'C. Kanthila, A. Boodi, K. Beddiar, Y. Amirat, and M. Benbouzid, “Occupancy prediction in buildings using cascaded LSTM model,” in Proc. IECON 2023—49th Annu. Conf. IEEE Ind. Electron. Soc., 2023, pp. 1–6, doi: 10.1109/IECON51785.2023.10311629.',
        'M. K. Diarra, A. Maniar, J.-B. Masson, B. Marhic, and L. Delahoche, “Occupancy state prediction by recurrent neural network (LSTM): Multi-room context,” Sensors, vol. 23, no. 23, Art. no. 9603, 2023, doi: 10.3390/s23239603.',
        'ISO/IEC, “Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models,” ISO/IEC 25010:2011, Geneva, Switzerland, 2011.',
        'ISO/IEC, “Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Guide to SQuaRE,” ISO/IEC 25000:2014, Geneva, Switzerland, 2014.',
        'P. Cerna, “Mobile computing framework for student engagement system in Ethiopian higher educational institution,” Int. J. Wireless Commun. Mobile Comput., vol. 6, no. 1, pp. 10–19, 2018, doi: 10.11648/j.wcmc.20180601.12.',
        'R. Likert, “A technique for the measurement of attitudes,” Archives of Psychology, vol. 22, no. 140, pp. 5–55, 1932.',
        'C. H. Lawshe, “A quantitative approach to content validity,” Personnel Psychology, vol. 28, no. 4, pp. 563–575, 1975, doi: 10.1111/j.1744-6570.1975.tb01393.x.',
    ]
    for i, ref in enumerate(refs, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.15)
        p.paragraph_format.first_line_indent = Inches(-0.15)
        p.paragraph_format.space_after = Pt(4)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run = p.add_run(f"[{i}] {ref}")
        set_run_font(run, size=8)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print("Wrote", OUT)
    print("Size MB:", round(OUT.stat().st_size / 1e6, 2))


if __name__ == "__main__":
    build()
