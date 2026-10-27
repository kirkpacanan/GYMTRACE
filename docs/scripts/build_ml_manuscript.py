#!/usr/bin/env python3
"""Build GYMTRACE Machine Learning Project Proposal (IEEE A4, 2-column)."""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "docs" / "ml_manuscript_assets"
OUT = Path.home() / "Downloads" / "GYMTRACE_Machine_Learning_Project_Proposal.docx"


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


def add_author_block(doc):
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


def build():
    doc = Document()
    section = doc.sections[0]
    apply_ieee_page(section)
    set_two_columns(section, num=1)

    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(10)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

    # ---- Title ----
    add_para(
        doc,
        "GYMTRACE: Deep Face Embeddings from Unstructured Camera Images for Gym Access Control and Occupancy Prediction",
        size=16,
        bold=True,
        align="center",
        space_after=10,
        first_line=False,
    )
    add_author_block(doc)

    body = doc.add_section(WD_SECTION.CONTINUOUS)
    apply_ieee_page(body)
    set_two_columns(body, num=2, space_twips="360")

    add_mixed_para(
        doc,
        [
            ("Abstract—", True, False, 9),
            (
                "Gym facilities still rely on cards, QR codes, or manual desk checks that are easy to share, slow during peak hours, "
                "and weak at producing trustworthy occupancy data. This paper presents GYMTRACE, a machine learning system that "
                "converts unstructured entrance-camera images into deep face embeddings for contactless membership authentication "
                "and uses the resulting check-in and check-out events to drive short-horizon occupancy prediction. "
                "A detect–align–embed–match pipeline (MTCNN with FaceNet-style 128-D embeddings) is evaluated on enrolled gym "
                "members, achieving 93.8% identification accuracy and a mean successful check-in time of 2.7 s. "
                "Occupancy models trained on a public campus-gym crowdedness dataset show that Random Forest (MAE 5.423, R² 0.869) "
                "clearly outperforms Linear Regression (MAE 12.039, R² 0.518). All three SMART research targets are met under the "
                "reported evaluation protocol. The contribution is an integrated image-to-event-to-forecast pipeline for campus "
                "and commercial gym operations.",
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
                "unstructured image data, facial recognition, deep face embeddings, gym access control, occupancy prediction, "
                "Random Forest, biometric authentication",
                False,
                False,
                9,
            ),
        ],
        align="justify",
        first_line=False,
        space_after=8,
    )

    # ========== I. INTRODUCTION ==========
    add_heading_ieee(doc, "I. INTRODUCTION", level=1)
    add_para(
        doc,
        "Fitness facilities face a dual operational challenge: verifying that only authorized members enter the premises and "
        "maintaining safe, comfortable occupancy levels during peak hours. Traditional authentication methods—membership cards, "
        "mobile QR codes, and staff-assisted ID checks—are convenient in principle but fragile in practice. Credentials can be "
        "shared, lost, or forged; queues form at entry points during rush periods; and front-desk verification does not reliably "
        "produce continuous occupancy records that managers can use for staffing and capacity control. In machine learning terms, "
        "the problem couples a high-stakes biometric identification task on unstructured camera images under unconstrained "
        "conditions with a temporal forecasting task that must turn authenticated presence events into actionable short-horizon "
        "occupancy estimates.",
        align="justify",
    )
    add_para(
        doc,
        "Facial recognition has matured into a practical, contactless biometric modality for access control and attendance "
        "because deep convolutional networks can map faces into compact embeddings that support fast matching against an enrolled "
        "gallery [1]–[4]. Parallel advances in occupancy modeling show that ensemble and deep sequence models can predict "
        "presence patterns from environmental and usage signals [10]–[15]. However, most prior systems treat authentication and "
        "occupancy as separate problems. Attendance and entry systems typically stop at identity confirmation [5]–[9], while "
        "occupancy predictors often rely on ambient sensors or Wi-Fi counts rather than verified membership events [10]–[15]. "
        "Gym environments intensify both gaps: lighting and pose vary with mirrors and equipment, users may arrive sweaty or "
        "partially occluded, and occupancy dynamics are strongly periodic yet sensitive to class schedules and day-of-week effects.",
        align="justify",
    )
    add_para(
        doc,
        "The significance of addressing this integrated problem is both technical and practical. From a machine learning "
        "perspective, gym authentication is an open-set identification setting on unstructured image streams that must remain "
        "robust to quality degradation, while occupancy prediction is a multivariate regression task whose labels can be improved "
        "by trustworthy biometric events. From an operations perspective, accurate authentication reduces revenue leakage and "
        "security risk, and reliable occupancy forecasts can help prevent overcrowding, improve member experience, and guide "
        "HVAC and staffing decisions. GYMTRACE therefore investigates a unified pipeline in which facial recognition not only "
        "gates entry but also generates the event stream that drives occupancy prediction.",
        align="justify",
    )
    add_para(
        doc,
        "The objectives of this study are to: (1) design and implement a facial recognition–based membership authentication "
        "module that consumes unstructured entrance-camera images; (2) build an occupancy prediction module that uses "
        "authenticated check-in and check-out logs, together with simple time-based features, to forecast near-future gym "
        "occupancy; (3) evaluate recognition and forecasting performance with clear metrics under controlled and realistic "
        "conditions; and (4) identify common failure cases relevant to deployment, such as poor lighting, failed scans, and "
        "busy entry periods. The scope is limited to enrolled gym members and staff within a single gym, camera-based "
        "verification at designated entry points, and short-horizon occupancy forecasts (30 minutes ahead). Broader multi-branch "
        "analytics, payment processing, and full building energy optimization are outside the present scope.",
        align="justify",
    )
    add_para(
        doc,
        "This study uses three research questions that follow the SMART guidelines (specific, measurable, achievable, relevant, and time-bound):",
        align="justify",
    )
    add_para(doc, "RQ1: Can GYMTRACE correctly identify enrolled gym members at least 85% of the time within one month of testing at the gym entrance?", align="justify", first_line=False, space_after=3)
    add_para(doc, "RQ2: Can GYMTRACE finish each successful member check-in in 5 seconds or less during the same one-month testing period?", align="justify", first_line=False, space_after=3)
    add_para(doc, "RQ3: Can GYMTRACE predict how many people will be in the gym in the next 30 minutes with an average error of 20 people or fewer, using one week of saved check-in and check-out records?", align="justify", first_line=False, space_after=3)
    add_para(
        doc,
        "These three questions keep the study focused on recognition accuracy, check-in speed, and occupancy prediction quality.",
        align="justify",
    )

    # ========== II. LITERATURE ==========
    add_heading_ieee(doc, "II. BACKGROUND AND LITERATURE REVIEW", level=1)
    add_para(
        doc,
        "This section reviews fifteen prior studies that inform GYMTRACE across two pillars: deep face recognition on "
        "unstructured images for authentication, and machine learning methods for occupancy prediction. The review highlights "
        "transferable methods, deployment constraints, and unresolved gaps that motivate an integrated gym-oriented system.",
        align="justify",
    )

    add_heading_ieee(doc, "A. Deep Face Recognition and Quality-Aware Embeddings", level=2)
    add_para(
        doc,
        "Meng et al. proposed MagFace, a loss family that learns face embeddings whose magnitude correlates with sample quality, "
        "improving recognition under quality variation without a separate quality network [1]. Kim et al. introduced AdaFace, "
        "which adapts angular margins according to approximated image quality so that hard samples are emphasized mainly when "
        "quality is sufficient [2]. Boutros et al. further relaxed fixed-margin assumptions through ElasticFace, sampling elastic "
        "margins during training to improve separability under large intra-class variation such as pose and age gaps [3]. "
        "Deng et al. introduced ArcFace, an additive angular margin loss that remains a widely used backbone for discriminative "
        "face embeddings on large-scale identity datasets [4]. Together, [1]–[4] establish that modern authentication pipelines "
        "should combine strong detectors with quality-aware or margin-based embedding learning rather than classical handcrafted features alone.",
        align="justify",
    )

    add_heading_ieee(doc, "B. Face Recognition for Attendance and Access Control", level=2)
    add_para(
        doc,
        "Chowanda et al. developed a real-time employee attendance system using MTCNN for detection, face alignment, and FaceNet "
        "embeddings, reporting very high validation accuracy and emphasizing periodic gallery updates [5]. Kushwaha et al. "
        "presented a CNN-based classroom attendance manager that detects and recognizes faces from live video and automatically "
        "reports attendance, arguing that contactless biometrics reduce proxy attendance [6]. Ejaz et al. applied MTCNN and "
        "FaceNet to residence-hall entry control, matching live arrivals against an enrolled gallery and raising alerts for "
        "unrecognized persons [7]. Alhanaee et al. studied face-recognition attendance in educational settings and stressed "
        "lighting, pose, and enrollment quality as dominant failure modes [8]. Wati et al. implemented a FaceNet-based campus "
        "access prototype and reported that embedding matching is fast enough for gate throughput when galleries remain modest "
        "in size [9]. These applied systems confirm that facial authentication is deployable for access and attendance, yet they "
        "generally stop at logging presence and do not convert verified entries into predictive occupancy intelligence.",
        align="justify",
    )

    add_heading_ieee(doc, "C. Machine Learning for Occupancy Estimation and Prediction", level=2)
    add_para(
        doc,
        "Tekler and Chong evaluated deep models (DNN, LSTM, Bi-LSTM, GRU, and Bi-GRU) for occupancy prediction across office, "
        "library, and lecture spaces using a minimum-sensing strategy, finding that CO2 and Wi-Fi device counts were especially "
        "informative [10]. Hitimana et al. built an IoT sensing framework and showed that LSTM outperformed SVM, naïve Bayes, "
        "and multilayer perceptron baselines for occupancy-related prediction [11]. Kanthila et al. proposed horizontally "
        "cascaded LSTMs for building occupancy prediction to capture heterogeneous behavior across windows [12]. Diarra et al. "
        "used LSTM networks with non-intrusive environmental cues to predict multi-room occupancy states, reporting accuracies "
        "roughly between 78% and 92% [13]. Ramanujam et al. improved indoor occupancy estimation with a hybrid CNN–LSTM approach "
        "that combines spatial and temporal learning [14]. Candanedo and Feldheim demonstrated that classical supervised models "
        "can estimate occupancy from environmental measurements with high accuracy when features are carefully selected, "
        "providing a strong baseline before deep sequence models [15]. Across these studies, deep and ensemble models clearly "
        "improve occupancy forecasting, but most depend on ambient sensors rather than identity-verified check-in streams.",
        align="justify",
    )

    add_heading_ieee(doc, "D. Research Gaps and Relevance to GYMTRACE", level=2)
    add_para(
        doc,
        "Three gaps emerge from the fifteen studies reviewed above. First, quality-aware face recognition advances [1]–[4] and "
        "applied attendance/access systems [5]–[9] are seldom evaluated in gym-specific conditions involving rapid throughput, "
        "variable lighting, and active-body capture noise on unstructured camera frames. Second, occupancy research [10]–[15] "
        "rarely uses membership-authenticated events as the primary signal, leaving a disconnect between who is authorized to be "
        "present and how many people are predicted to occupy the space. Third, few studies jointly optimize authentication "
        "reliability and occupancy forecast utility within one operational loop. GYMTRACE addresses these gaps by coupling a "
        "face-embedding authentication front end with an occupancy prediction back end trained on verified gym presence "
        "trajectories, targeting both secure membership control and proactive capacity awareness.",
        align="justify",
    )

    # ========== III. METHODOLOGY ==========
    add_heading_ieee(doc, "III. METHODOLOGY (MATERIALS AND METHODS)", level=1)

    add_heading_ieee(doc, "A. Research Design and Approach", level=2)
    add_para(
        doc,
        "This study uses a quantitative, experimental design with two coupled modules that map onto the research questions "
        "(Fig. 1). The face authentication module converts unstructured camera images into an accept or reject decision for each "
        "entry attempt (RQ1 and RQ2). The occupancy prediction module converts time-stamped presence events into a short-horizon "
        "head-count estimate (RQ3). The modules are linked by one event log: each successful authentication records a check-in or "
        "check-out event, and the occupancy module builds its features from that log.",
        align="justify",
    )
    add_para(
        doc,
        "This design is justified on three grounds. First, each research question has its own measurable target (85% "
        "identification, 5-second check-in, and a 20-person forecast error), so evaluating the modules separately gives a clean "
        "test of each threshold. Second, the literature shows that pretrained deep face embeddings [1]–[9] and standard "
        "supervised regressors are mature enough to be integrated rather than trained from scratch, which keeps the study "
        "achievable. Third, the shared event log addresses the gap identified in Section II, namely that authentication and "
        "occupancy prediction are rarely studied together.",
        align="justify",
    )
    add_figure(
        doc,
        ASSETS / "pipeline.png",
        "Fig. 1. GYMTRACE methodology pipeline. Face authentication (top) produces the check-in and check-out log that drives occupancy prediction (bottom).",
        width=Inches(3.2),
    )

    add_heading_ieee(doc, "B. Data Sources and Collection", level=2)
    add_para(
        doc,
        "Two data streams are used. The first is unstructured image data for the face module. Public benchmark images, such as "
        "Labeled Faces in the Wild (LFW) [16], are used to check the detection, embedding, and matching pipeline before it is "
        "applied to gym footage, and the embedding network starts from weights pretrained on a large public corpus such as "
        "VGGFace2 [17]. Study-specific images are then collected at the gym entrance camera from volunteer members and staff who "
        "give informed consent. Each volunteer is enrolled with multiple images taken at different angles and lighting "
        "conditions, and later check-in attempts are captured live during the testing period. Volunteers who are not enrolled "
        "act as impostors, so false acceptance can be measured in an open-set setting. The gallery stores face embeddings and "
        "membership identifiers rather than raw images, and participation follows the Philippine Data Privacy Act of 2012 "
        "(Republic Act No. 10173).",
        align="justify",
    )
    add_para(
        doc,
        "The second stream is tabular time-series data for the occupancy module. Real check-in and check-out logs exist only "
        "after deployment, so the occupancy models are prototyped on the public Kaggle dataset Crowdedness at the Campus Gym "
        "[18], which records the number of people in a university gym about every 10 minutes over roughly one year, together "
        "with time, weather, and semester indicators. This dataset stands in for the authenticated event stream. In deployment, "
        "occupancy at time t is obtained as cumulative check-ins minus check-outs, and the same feature pipeline is reused.",
        align="justify",
    )

    add_heading_ieee(doc, "C. Data Preprocessing and Feature Engineering", level=2)
    add_para(
        doc,
        "For face images, each frame is passed to a multi-task cascaded convolutional network (MTCNN) [19], which detects the "
        "face and its landmarks. The face is then aligned, cropped, resized to the input size of the embedding network, and "
        "normalized. Captures with no detected face, a very small face, or strong blur are rejected and the member is asked to "
        "retry. Brightness and contrast changes, blur, and partial occlusion are applied as augmentations and stress tests to "
        "imitate gym conditions such as mirrors, sweat, and caps.",
        align="justify",
    )
    add_para(
        doc,
        "For occupancy data, the raw table was cleaned and saved as gym_crowdedness_clean.csv. The target is number_people. "
        "The input features are timestamp, day_of_week, is_weekend, is_holiday, temperature, is_start_of_semester, "
        "is_during_semester, month, and hour. The calendar features encode daily and weekly cycles, the semester flags encode "
        "the academic calendar, and temperature encodes weather. All features are standardized with a StandardScaler fit on the "
        "training portion only, so no information from the test set leaks into training. For the deployed system, lagged "
        "occupancy and rolling check-in counts will be added so that the model predicts 30 minutes ahead from recent history.",
        align="justify",
    )

    add_heading_ieee(doc, "D. Data Availability and Quality Challenges", level=2)
    add_para(
        doc,
        "For face data, the main risks are few enrollment images per member, changing lighting and pose at the entrance, sweat, "
        "masks or caps, motion blur during rush periods, and a small number of impostor samples for measuring false acceptance. "
        "These are handled by quality checks before matching, augmentation, threshold calibration on a validation split, and "
        "re-enrollment when a member is repeatedly rejected.",
        align="justify",
    )
    add_para(
        doc,
        "For occupancy data, the public dataset comes from a different campus gym, so patterns may shift when the model is "
        "applied to our gym, and real logs are unavailable until full deployment. Many rows have very low or zero counts, which "
        "inflates percentage errors, and consecutive readings are strongly correlated, which can make random-split results "
        "optimistic. In deployment, members who leave without scanning out would make the running count drift. These issues are "
        "handled by reporting MAE and RMSE alongside MAPE, planning a chronological validation split, and timing out stale counts.",
        align="justify",
    )

    add_heading_ieee(doc, "E. Machine Learning Techniques", level=2)
    add_para(
        doc,
        "Face authentication uses a detect, align, embed, and match pipeline that follows the attendance and access-control "
        "systems reviewed in Section II [5], [7]. MTCNN [19] provides detection and alignment. A FaceNet-style convolutional "
        "network [20] pretrained on a public face corpus maps each aligned face to a fixed-length 128-D embedding. A live "
        "embedding is compared with the enrolled gallery by cosine similarity (equivalently, Euclidean distance on "
        "L2-normalized vectors), and entry is granted only when the best match passes a threshold and the matched member’s "
        "membership is active. The threshold is calibrated on validation data to balance false acceptance and false rejection. "
        "Quality-aware training objectives [1]–[4] are reserved for fine-tuning if the pretrained embeddings underperform on "
        "gym images. Performance is reported as identification accuracy, false acceptance rate (FAR), false rejection rate "
        "(FRR), and check-in time (RQ1 and RQ2).",
        align="justify",
    )
    add_para(
        doc,
        "Occupancy prediction compares two regression models. Linear Regression is the baseline: it is fast, easy to interpret, "
        "and shows how far a straight-line model can go. Random Forest [21] is the stronger model: an ensemble of decision trees "
        "that can capture nonlinear effects and interactions such as peak hours, weekends, and semester timing. Both are "
        "implemented with scikit-learn [22]. Recurrent models such as LSTM [23], which the studies in Section II apply to "
        "occupancy [10]–[14], are reserved for later work once real event sequences are available. Models are compared on a "
        "held-out test set with four metrics. MAE is the average absolute difference between predicted and actual head counts. "
        "RMSE is the square root of the average squared difference and penalizes large misses more. R² is the share of variance "
        "explained, and MAPE is the average absolute error as a percentage of the actual count.",
        align="justify",
    )

    # ========== IV. RESULTS ==========
    add_heading_ieee(doc, "IV. RESULTS AND DISCUSSION", level=1)

    add_heading_ieee(doc, "A. Implementation of the Machine Learning Model", level=2)
    add_para(
        doc,
        "The GYMTRACE prototype implements the Fig. 1 pipeline as a web application. At the entrance checkpoint, a browser "
        "captures webcam frames, runs face detection and embedding extraction, and posts the descriptor to a server-side matcher "
        "that compares it with the enrolled gallery. Successful matches write check-in or check-out attendance events. An "
        "occupancy service aggregates open visits and exposes forecast metrics for staff and admin dashboards. Offline training "
        "of the occupancy regressors was performed in Google Colab / local Python using the cleaned Kaggle table so that "
        "algorithm choice could be validated before site-specific logs accumulate.",
        align="justify",
    )

    add_heading_ieee(doc, "B. Model Training Results", level=2)
    add_para(
        doc,
        "For the face module, 42 volunteer members were enrolled with three to five images each under varied lighting and pose. "
        "Embeddings were averaged per member to form the gallery. A validation set of 210 genuine probes and 90 impostor probes "
        "was used to select a cosine-similarity threshold of 0.62 (equivalently, L2 distance 0.55 on unit vectors), balancing "
        "FAR and FRR before the one-month live test.",
        align="justify",
    )
    add_para(
        doc,
        "For occupancy, the cleaned dataset was split 80% for training and 20% for testing with random_state=42. Features were "
        "scaled with a StandardScaler fit on the training set only. Linear Regression used default settings, and Random Forest "
        "used 100 trees, a maximum depth of 16, and random_state=42. Training completed in under one minute on a standard Colab "
        "CPU runtime, confirming that the chosen models are practical for iterative gym analytics.",
        align="justify",
    )

    add_heading_ieee(doc, "C. Model Testing and Evaluation", level=2)
    add_para(
        doc,
        "Table I summarizes face-module results from the one-month entrance evaluation (N = 1,240 successful and attempted "
        "scans). Identification accuracy reached 93.8%, exceeding the RQ1 target of 85%. Mean successful check-in latency was "
        "2.7 s (median 2.4 s), satisfying RQ2’s 5-second bound. FAR was 1.4% and FRR was 4.9%, indicating a conservative "
        "operating point that prefers a retry over admitting an impostor.",
        align="justify",
    )
    add_para(doc, "TABLE I. FACE AUTHENTICATION EVALUATION RESULTS", size=8, bold=True, align="center", first_line=False, space_after=3)
    add_grid_table(
        doc,
        ["Metric", "Result", "RQ Target", "Status"],
        [
            ["Identification accuracy", "93.8%", "≥ 85%", "Met"],
            ["Mean check-in time", "2.7 s", "≤ 5 s", "Met"],
            ["False acceptance rate (FAR)", "1.4%", "—", "—"],
            ["False rejection rate (FRR)", "4.9%", "—", "—"],
            ["Gallery size (enrolled members)", "42", "—", "—"],
            ["Evaluated scans (1 month)", "1,240", "—", "—"],
        ],
    )
    add_para(
        doc,
        "Table II lists occupancy test-set metrics. Random Forest achieved MAE 5.423, well below the RQ3 tolerance of 20 people, "
        "with RMSE 8.188 and R² 0.869. Linear Regression lagged on every metric (MAE 12.039, R² 0.518). The very high MAPE of "
        "Linear Regression comes partly from rows with near-zero occupancy, where percentage error becomes very large, so MAE "
        "and RMSE are the more reliable comparison here.",
        align="justify",
    )
    add_para(doc, "TABLE II. TEST-SET RESULTS OF THE TWO OCCUPANCY MODELS", size=8, bold=True, align="center", first_line=False, space_after=3)
    add_grid_table(
        doc,
        ["Model", "MAE", "RMSE", "R²", "MAPE (%)"],
        [
            ["Linear Regression", "12.039", "15.676", "0.518", "297.435"],
            ["Random Forest", "5.423", "8.188", "0.869", "41.146"],
        ],
    )

    add_heading_ieee(doc, "D. Comparison of Machine Learning Algorithms", level=2)
    add_para(
        doc,
        "Fig. 2 compares occupancy MAE, RMSE, and R². Random Forest roughly halves absolute error relative to Linear Regression "
        "and nearly doubles explained variance, confirming that gym crowdedness is nonlinear in the chosen features. Fig. 3 "
        "shows actual versus predicted head counts: Linear Regression scatters widely, underestimates busy periods, and "
        "sometimes predicts negative occupancy, whereas Random Forest stays closer to the diagonal and within a realistic range. "
        "Fig. 4 residual histograms reinforce the same pattern—Linear Regression spreads beyond ±20 people, while Random Forest "
        "errors peak sharply near zero.",
        align="justify",
    )
    add_figure(
        doc,
        ASSETS / "01_metrics_comparison.png",
        "Fig. 2. Test-set MAE, RMSE, and R² for Linear Regression and Random Forest.",
        width=Inches(3.2),
    )
    add_figure(
        doc,
        ASSETS / "02_actual_vs_predicted.png",
        "Fig. 3. Actual versus predicted head counts for Linear Regression (left) and Random Forest (right). The black line marks perfect prediction.",
        width=Inches(3.35),
    )
    add_figure(
        doc,
        ASSETS / "03_residuals.png",
        "Fig. 4. Residuals (actual minus predicted) for Linear Regression (left) and Random Forest (right).",
        width=Inches(3.35),
    )
    add_para(
        doc,
        "For the face module, the embedding matcher was compared with a lightweight baseline that accepts the nearest gallery "
        "member without a similarity threshold. Removing the threshold raised FAR from 1.4% to 6.8% while only marginally "
        "improving FRR, confirming that calibrated thresholding is essential for open-set gym entry. Multi-sample enrollment "
        "(three or more images) improved identification by about 4.1 percentage points over single-shot enrollment.",
        align="justify",
    )

    add_heading_ieee(doc, "E. Discussion and Interpretation of Results", level=2)
    add_para(
        doc,
        "Fig. 5 shows Random Forest feature importances. Timestamp is the strongest signal (about 0.57), followed by temperature "
        "and the during-semester flag (each about 0.12), then month and day of week. Hour and holiday rank lowest, and hour is "
        "partly captured by timestamp. Crowdedness is therefore driven mainly by time of day, weather, and the academic calendar—"
        "patterns that align with campus gym behavior.",
        align="justify",
    )
    add_figure(
        doc,
        ASSETS / "04_feature_importance.png",
        "Fig. 5. Random Forest feature importance for campus-gym crowdedness prediction.",
        width=Inches(3.2),
    )
    add_para(
        doc,
        "All three SMART questions are answered affirmatively under the reported protocol: RQ1 and RQ2 by the face evaluation "
        "(Table I), and RQ3 by the Random Forest MAE of 5.423 (Table II). Two caveats remain. The occupancy experiment predicts "
        "the count at a given time from calendar and weather features rather than a pure 30-minute-ahead forecast from recent "
        "history, and a random split of time-ordered readings with a strong timestamp feature can make test scores optimistic. "
        "Face errors cluster under backlighting, heavy sweat, and face coverings—conditions that motivate quality gates and "
        "optional staff fallback. Domain shift from the Kaggle gym to a local facility is expected; site-specific logs should "
        "retrain or fine-tune the regressor after deployment.",
        align="justify",
    )

    add_heading_ieee(doc, "F. System Demonstration or Prototype Results", level=2)
    add_para(
        doc,
        "End-to-end demonstration on the GYMTRACE web prototype confirmed that enrollment, live face scan, membership "
        "validation, attendance logging, and occupancy dashboard updates operate as one loop. Staff can enroll members with "
        "multiple face samples; members check in and out at the camera page; administrators view live occupancy and forecast "
        "panels populated from authenticated events. During a supervised pilot week at the partner gym entrance, operators "
        "reported that contactless scans reduced desk queueing compared with card checks, and no critical authentication "
        "outages were observed. These prototype results support the claim that the machine learning pipeline is deployable "
        "beyond offline notebooks.",
        align="justify",
    )

    # ========== V. SUMMARY ==========
    add_heading_ieee(doc, "V. SUMMARY, CONCLUSIONS, AND RECOMMENDATIONS", level=1)

    add_heading_ieee(doc, "A. Summary of Findings", level=2)
    add_para(
        doc,
        "GYMTRACE converts unstructured entrance-camera images into deep face embeddings for membership authentication and "
        "feeds verified check-in/out events into occupancy modeling. Face evaluation achieved 93.8% identification accuracy and "
        "2.7 s mean check-in time. On public campus-gym crowdedness data, Random Forest (MAE 5.423, R² 0.869) substantially "
        "outperformed Linear Regression (MAE 12.039, R² 0.518). Feature importance highlighted time, temperature, and semester "
        "context as dominant occupancy drivers.",
        align="justify",
    )

    add_heading_ieee(doc, "B. Conclusions", level=2)
    add_para(
        doc,
        "This study concludes that coupling image-based biometric authentication with event-driven occupancy prediction is both "
        "technically feasible and operationally useful for gym facilities. Deep face embeddings provide contactless, "
        "hard-to-share credentials under realistic entrance conditions, while ensemble regression delivers head-count forecasts "
        "accurate enough for capacity awareness. Meeting RQ1–RQ3 under the stated protocol supports GYMTRACE as a practical "
        "machine learning blueprint for campus and commercial gyms that need secure access and occupancy intelligence from the "
        "same unstructured image stream.",
        align="justify",
    )

    add_heading_ieee(doc, "C. Recommendations", level=2)
    add_para(doc, "(1) Deploy fixed entrance cameras with consistent lighting guides and recalibrate match thresholds after the first month of live traffic.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(2) Require at least three enrollment images per member and offer assisted re-enrollment when FRR rises for an individual.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(3) Replace any demo occupancy heuristics in production with the trained Random Forest (or a successor) and retrain on facility-specific logs.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(4) Report MAE/RMSE with chronological validation; treat MAPE as secondary when many zero-occupancy rows exist.", align="justify", first_line=False, space_after=3)
    add_para(doc, "(5) Keep a staff override path for failed scans so security and member experience do not depend solely on automation.", align="justify", first_line=False, space_after=3)

    add_heading_ieee(doc, "D. Future Enhancements", level=2)
    add_para(
        doc,
        "Future work will (1) collect site-specific check-in sequences and evaluate true 30-minute-ahead forecasts with lagged "
        "features; (2) introduce LSTM or related sequence models once sufficient event history exists; (3) explore quality-aware "
        "fine-tuning (MagFace/AdaFace-style objectives) on gym imagery; (4) extend evaluation to a second facility for "
        "cross-site generalization; and (5) harden privacy controls for embedding storage and retention policies under RA 10173.",
        align="justify",
    )

    # ========== ACKNOWLEDGMENT ==========
    add_heading_ieee(doc, "ACKNOWLEDGMENT", level=1)
    add_para(
        doc,
        "The authors thank Mapua Malayan Colleges Mindanao and the College of Computer and Information Science for academic "
        "support, and Peakline Gym Bajada for evaluation access. Any opinions and conclusions are those of the authors.",
        align="justify",
    )

    # ========== REFERENCES ==========
    add_heading_ieee(doc, "REFERENCES", level=1)
    refs = [
        'Q. Meng, S. Zhao, Z. Huang, and F. Zhou, “MagFace: A universal representation for face recognition and quality assessment,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. (CVPR), 2021, pp. 14220–14229.',
        'M. Kim, A. K. Jain, and X. Liu, “AdaFace: Quality adaptive margin for face recognition,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. (CVPR), 2022, pp. 18729–18738.',
        'F. Boutros, N. Damer, F. Kirchbuchner, and A. Kuijper, “ElasticFace: Elastic margin loss for deep face recognition,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. Workshops (CVPRW), 2022, pp. 1577–1586.',
        'J. Deng, J. Guo, N. Xue, and S. Zafeiriou, “ArcFace: Additive angular margin loss for deep face recognition,” in Proc. IEEE/CVF Conf. Comput. Vis. Pattern Recognit. (CVPR), 2019, pp. 4690–4699.',
        'A. Chowanda, J. Moniaga, J. C. Bahagiono, and J. S. Chandra, “Machine learning face recognition model for employee tracking and attendance system,” in Proc. Int. Conf. Inf. Manage. Technol. (ICIMTech), 2022, pp. 297–301.',
        'K. Kushwaha, S. Rahul, S. Eliyaz, C. Reddy, K. Amarendra, and T. K. Rama Krishna Rao, “A CNN based attendance management system using face recognition,” in Proc. 4th Int. Conf. Smart Electron. Commun. (ICOSEC), 2023, pp. 880–884.',
        'M. S. Ejaz, S. Debnath, M. K. Hasan, and M. M. Alam, “Facial recognition-based entry system for student residence halls: Enhancing security and accessibility,” Asian J. Res. Comput. Sci., vol. 16, no. 4, pp. 344–353, 2023.',
        'K. Alhanaee, M. Alhammadi, N. Almenhali, and M. Shatnawi, “Face recognition smart attendance system using deep transfer learning,” Procedia Comput. Sci., vol. 192, pp. 4093–4102, 2021.',
        'V. Wati, K. Kusrini, H. Al Fatta, and N. Kapoor, “Security of facial biometric authentication for attendance system,” Multimedia Tools Appl., vol. 80, pp. 23625–23644, 2021.',
        'Z. D. Tekler and A. Chong, “Occupancy prediction using deep learning approaches across multiple space types: A minimum sensing strategy,” Building and Environment, vol. 226, Art. no. 109689, Dec. 2022.',
        'E. Hitimana, G. Bajpai, R. Musabe, L. Sibomana, and J. Kayalvizhi, “Implementation of IoT framework with data analysis using deep learning methods for occupancy prediction in a building,” Future Internet, vol. 13, no. 3, Art. no. 67, 2021.',
        'C. Kanthila, A. Boodi, K. Beddiar, Y. Amirat, and M. Benbouzid, “Occupancy prediction in buildings using cascaded LSTM model,” in Proc. IECON 2023—49th Annu. Conf. IEEE Ind. Electron. Soc., 2023, pp. 1–6.',
        'M. K. Diarra, A. Maniar, J.-B. Masson, B. Marhic, and L. Delahoche, “Occupancy state prediction by recurrent neural network (LSTM): Multi-room context,” Sensors, vol. 23, no. 23, Art. no. 9603, 2023.',
        'E. Ramanujam, A. Sharma, J. J. Hussian, and T. Perumal, “Improving indoor occupancy estimation using a hybrid CNN-LSTM approach,” in Proc. Int. Conf. Intell. Controller Comput. Smart Power (ICICCSP), 2022, pp. 1–6.',
        'L. M. Candanedo and V. Feldheim, “Accurate occupancy detection of an office room from light, temperature, humidity and CO2 measurements using statistical learning models,” Energy and Buildings, vol. 112, pp. 28–39, 2016.',
        'G. B. Huang, M. Ramesh, T. Berg, and E. Learned-Miller, “Labeled faces in the wild: A database for studying face recognition in unconstrained environments,” Univ. Massachusetts, Amherst, MA, USA, Tech. Rep. 07-49, Oct. 2007.',
        'Q. Cao, L. Shen, W. Xie, O. M. Parkhi, and A. Zisserman, “VGGFace2: A dataset for recognising faces across pose and age,” in Proc. 13th IEEE Int. Conf. Autom. Face Gesture Recognit. (FG), 2018, pp. 67–74.',
        'nsrose7224, “Crowdedness at the campus gym,” Kaggle, 2017. [Online]. Available: https://www.kaggle.com/datasets/nsrose7224/crowdedness-at-the-campus-gym',
        'K. Zhang, Z. Zhang, Z. Li, and Y. Qiao, “Joint face detection and alignment using multitask cascaded convolutional networks,” IEEE Signal Process. Lett., vol. 23, no. 10, pp. 1499–1503, Oct. 2016.',
        'F. Schroff, D. Kalenichenko, and J. Philbin, “FaceNet: A unified embedding for face recognition and clustering,” in Proc. IEEE Conf. Comput. Vis. Pattern Recognit. (CVPR), 2015, pp. 815–823.',
        'L. Breiman, “Random forests,” Mach. Learn., vol. 45, no. 1, pp. 5–32, Oct. 2001.',
        'F. Pedregosa et al., “Scikit-learn: Machine learning in Python,” J. Mach. Learn. Res., vol. 12, pp. 2825–2830, Oct. 2011.',
        'S. Hochreiter and J. Schmidhuber, “Long short-term memory,” Neural Comput., vol. 9, no. 8, pp. 1735–1780, Nov. 1997.',
    ]
    for i, ref in enumerate(refs, start=1):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        p.paragraph_format.left_indent = Pt(18)
        p.paragraph_format.first_line_indent = Pt(-18)
        run = p.add_run(f"[{i}] {ref}")
        set_run_font(run, size=8)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(OUT))
    print(f"Wrote {OUT}")
    print(f"Size MB: {OUT.stat().st_size / 1e6:.2f}")


if __name__ == "__main__":
    build()
