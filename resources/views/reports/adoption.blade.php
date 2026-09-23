<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        @page {
            margin: 25px 22px 35px 22px;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #2D3748;
            line-height: 1.35;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }
        
        /* ── Official Letterhead ── */
        .letterhead {
            width: 100%;
            border-bottom: 2px solid #D4A017;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .org-line {
            font-size: 9.5px;
            color: #4A5568;
            line-height: 1.3;
            letter-spacing: 0.2px;
        }
        .brand-logo {
            font-size: 19px;
            font-weight: bold;
            color: #B8860B;
            letter-spacing: -0.5px;
            line-height: 1.15;
        }
        .brand-subtitle {
            font-size: 8px;
            color: #8C6D23;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .doc-title {
            font-size: 13.5px;
            font-weight: bold;
            color: #1A202C;
        }
        .doc-meta {
            font-size: 8px;
            color: #718096;
        }

        /* ── Filter Banner ── */
        .filter-banner {
            background-color: #FAF5EB;
            border: 1px solid #EADBBA;
            border-left: 3px solid #D4A017;
            padding: 6px 10px;
            margin-bottom: 12px;
            font-size: 9px;
            color: #4A5568;
        }
        .filter-tag {
            display: inline-block;
            background-color: #F5EDD7;
            color: #8C6A0A;
            padding: 1.5px 5px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 8px;
            margin-left: 4px;
            border: 1px solid #E2D3B0;
        }

        /* ── Executive Metric KPI Cards ── */
        .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 6px 0;
            margin-bottom: 14px;
        }
        .kpi-card {
            border-radius: 4px;
            padding: 8px 6px;
            text-align: center;
        }
        .kpi-total {
            background-color: #F7FAFC;
            border: 1px solid #E2E8F0;
            border-top: 3px solid #4A5568;
        }
        .kpi-approved {
            background-color: #F0FDF4;
            border: 1px solid #DCFCE7;
            border-top: 3px solid #16A34A;
        }
        .kpi-pending {
            background-color: #FFFBEB;
            border: 1px solid #FEF3C7;
            border-top: 3px solid #D97706;
        }
        .kpi-rejected {
            background-color: #FEF2F2;
            border: 1px solid #FEE2E2;
            border-top: 3px solid #DC2626;
        }
        .kpi-score {
            background-color: #EFF6FF;
            border: 1px solid #DBEAFE;
            border-top: 3px solid #2563EB;
        }
        .kpi-label {
            font-size: 7.5px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.3px;
        }
        .kpi-val {
            font-size: 16px;
            font-weight: bold;
            margin-top: 2px;
            line-height: 1.1;
        }
        .kpi-sub {
            font-size: 7.5px;
            margin-top: 1px;
        }

        /* ── Data Table ── */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        table.data-table th {
            background-color: #F7FAFC;
            color: #4A5568;
            font-weight: bold;
            text-align: left;
            padding: 6px 7px;
            border: 1px solid #E2E8F0;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        table.data-table td {
            padding: 6px 7px;
            border: 1px solid #EDF2F7;
            font-size: 9px;
            vertical-align: middle;
        }
        table.data-table tr {
            page-break-inside: avoid;
        }
        table.data-table tr:nth-child(even) {
            background-color: #FCFDFD;
        }
        
        /* ── Status Badges ── */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .badge-approved { background-color: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
        .badge-rejected { background-color: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
        .badge-pending  { background-color: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
        .badge-review   { background-color: #DBEAFE; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .badge-audit    { background-color: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }

        /* ── Score Indicators ── */
        .score-pill {
            display: inline-block;
            padding: 1.5px 6px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8.5px;
            text-align: center;
        }
        .score-high   { background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
        .score-medium { background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
        .score-low    { background-color: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }

        /* ── Sign-off Attestation Block ── */
        .signoff-table {
            width: 100%;
            margin-top: 25px;
            page-break-inside: avoid;
            border-top: 1px dashed #CBD5E0;
            padding-top: 14px;
        }
        .signoff-label {
            font-size: 8px;
            text-transform: uppercase;
            color: #718096;
            font-weight: bold;
            letter-spacing: 0.4px;
            margin-bottom: 30px;
        }
        .signoff-line {
            border-bottom: 1px solid #2D3748;
            width: 80%;
            margin-bottom: 4px;
        }
        .signoff-name {
            font-size: 9.5px;
            font-weight: bold;
            color: #1A202C;
        }
        .signoff-role {
            font-size: 8px;
            color: #718096;
        }

        /* ── Footer ── */
        .report-footer {
            margin-top: 18px;
            text-align: center;
            color: #A0AEC0;
            font-size: 7.5px;
            border-top: 1px solid #EDF2F7;
            padding-top: 6px;
            line-height: 1.3;
        }
    </style>
</head>
<body>

    <!-- ── Official Header ── -->
    @php
        $viracLogoPath = public_path('images/virac-logo.png');
        $viracLogoBase64 = file_exists($viracLogoPath) ? base64_encode(file_get_contents($viracLogoPath)) : null;

        $furfectLogoPath = public_path('favicon.svg');
        $furfectLogoBase64 = file_exists($furfectLogoPath) ? base64_encode(file_get_contents($furfectLogoPath)) : null;
    @endphp
    <div class="letterhead">
        <table align="center" style="margin: 0 auto;" cellpadding="0" cellspacing="0">
            <tr>
                <td style="vertical-align: middle; text-align: right; padding-right: 14px;">
                    @if($viracLogoBase64)
                        <img src="data:image/png;base64,{{ $viracLogoBase64 }}" style="width: 48px; height: 48px;" alt="Bayan ng Virac Logo">
                    @endif
                </td>
                <td style="vertical-align: middle; text-align: center;">
                    <div class="org-line" style="font-weight: 500; font-size: 9px; line-height: 1.25;">Republic of the Philippines</div>
                    <div class="org-line" style="font-weight: bold; font-size: 11.5px; color: #1A202C; line-height: 1.25;">Municipality of Virac</div>
                    <div class="org-line" style="font-size: 9px; line-height: 1.25;">Catanduanes</div>
                </td>
                <td style="vertical-align: middle; text-align: left; padding-left: 14px;">
                    @if($furfectLogoBase64)
                        <img src="data:image/svg+xml;base64,{{ $furfectLogoBase64 }}" style="width: 44px; height: 44px;" alt="FurFect Match Logo">
                    @endif
                </td>
            </tr>
        </table>
        <div style="text-align: center; margin-top: 6px;">
            <div class="brand-logo">FurFect Match</div>
            <div class="brand-subtitle">Automated Animal Adoption &amp; Decision Support System</div>
            <div class="doc-title" style="margin-top: 3px;">{{ $title }}</div>
            <div class="doc-meta" style="margin-top: 2px;">
                Generated on: {{ $date }}
            </div>
        </div>
    </div>

    <!-- ── Filter Criteria Banner (if any active filters) ── -->
    @if(!empty($activeFilters))
        <div class="filter-banner">
            <strong>Active Filter Parameters:</strong>
            @foreach($activeFilters as $key => $val)
                <span class="filter-tag">{{ $key }}: {{ $val }}</span>
            @endforeach
        </div>
    @endif

    <!-- ── Executive KPI Summary Cards ── -->
    <table class="kpi-table" cellpadding="0" cellspacing="0">
        <tr>
            <td class="kpi-card kpi-total" style="width: 20%;">
                <div class="kpi-label" style="color: #4A5568;">Total Records</div>
                <div class="kpi-val" style="color: #1A202C;">{{ $total }}</div>
                <div class="kpi-sub" style="color: #718096;">Applications logged</div>
            </td>
            <td class="kpi-card kpi-approved" style="width: 20%;">
                <div class="kpi-label" style="color: #15803D;">Approved</div>
                <div class="kpi-val" style="color: #16A34A;">{{ $approved }}</div>
                <div class="kpi-sub" style="color: #15803D;">{{ $approval_rate ?? 0 }}% approval rate</div>
            </td>
            <td class="kpi-card kpi-pending" style="width: 20%;">
                <div class="kpi-label" style="color: #B45309;">Pending Action</div>
                <div class="kpi-val" style="color: #D97706;">{{ $pending }}</div>
                <div class="kpi-sub" style="color: #92400E;">In review / audit</div>
            </td>
            <td class="kpi-card kpi-rejected" style="width: 20%;">
                <div class="kpi-label" style="color: #B91C1C;">Rejected</div>
                <div class="kpi-val" style="color: #DC2626;">{{ $rejected }}</div>
                <div class="kpi-sub" style="color: #991B1B;">Disqualified / lapsed</div>
            </td>
            @if(isset($avg_score))
            <td class="kpi-card kpi-score" style="width: 20%;">
                <div class="kpi-label" style="color: #1D4ED8;">Avg DSS Score</div>
                <div class="kpi-val" style="color: #2563EB;">{{ $avg_score }}%</div>
                <div class="kpi-sub" style="color: #1E40AF;">Compatibility index</div>
            </td>
            @endif
        </tr>
    </table>

    <!-- ── Data Table ── -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 4%; text-align: center;">#</th>
                <th style="width: 14%;">Reference #</th>
                <th style="width: 22%;">Adopter Information</th>
                <th style="width: 20%;">Animal Specifications</th>
                <th style="width: 16%;">Assigned Shelter</th>
                <th style="width: 10%; text-align: center;">DSS Match</th>
                <th style="width: 14%; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($applications as $index => $app)
                <tr>
                    <td style="text-align: center; color: #718096; font-size: 8px;">{{ $index + 1 }}</td>
                    <td>
                        <strong style="font-family: monospace; font-size: 8.5px; color: #1A202C;">
                            {{ $app->reference_number }}
                        </strong>
                        <div style="font-size: 7.5px; color: #718096; margin-top: 1px;">
                            {{ $app->submitted_at ? $app->submitted_at->format('M d, Y') : '-' }}
                        </div>
                    </td>
                    <td>
                        <strong style="color: #2D3748;">{{ $app->adopter?->name ?? 'N/A' }}</strong>
                        <div style="color: #718096; font-size: 7.5px; margin-top: 1px;">
                            {{ $app->adopter?->email ?? 'No email provided' }}
                        </div>
                    </td>
                    <td>
                        <strong style="color: #2D3748;">{{ $app->pet?->name ?? 'N/A' }}</strong>
                        <div style="color: #718096; font-size: 7.5px; margin-top: 1px;">
                            {{ ucfirst((string) ($app->pet?->species ?? '')) }}
                            @if(!empty($app->pet?->breed) && $app->pet->breed !== 'Hidden')
                                &bull; {{ $app->pet->breed }}
                            @endif
                        </div>
                    </td>
                    <td>
                        <div style="color: #2D3748; font-weight: 500;">
                            {{ $app->pet?->shelter?->name ?? 'Virac Municipal Shelter' }}
                        </div>
                    </td>
                    <td style="text-align: center;">
                        @php
                            $score = (int) ($app->dss_score ?? 0);
                            $scoreClass = $score >= 80 ? 'score-high' : ($score >= 50 ? 'score-medium' : 'score-low');
                        @endphp
                        <span class="score-pill {{ $scoreClass }}">
                            {{ $score }}%
                        </span>
                    </td>
                    <td style="text-align: center;">
                        @if($app->status === 'approved')
                            <span class="badge badge-approved">Approved</span>
                        @elseif($app->status === 'rejected')
                            <span class="badge badge-rejected">Rejected</span>
                        @elseif($app->status === 'pending')
                            <span class="badge badge-pending">Pending</span>
                        @elseif($app->status === 'under_review')
                            <span class="badge badge-review">Under Review</span>
                        @else
                            <span class="badge badge-audit">MAO Audit</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; color: #A0AEC0; padding: 22px 10px;">
                        No adoption applications found matching the selected filter criteria.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- ── Sign-off Attestation Block ── -->
    <table class="signoff-table" cellpadding="0" cellspacing="0">
        <tr>
            <td style="width: 45%; vertical-align: top;">
                <div class="signoff-label">Prepared by:</div>
                <div class="signoff-line"></div>
                <div class="signoff-name">{{ $generated_by ?? 'Administrative Staff' }}</div>
                <div class="signoff-role">{{ $user_role ?? 'Shelter Operations Staff' }} &bull; Virac Municipal Shelter</div>
            </td>
            <td style="width: 10%;"></td>
            <td style="width: 45%; vertical-align: top;">
                <div class="signoff-label">Attested &amp; Verified by:</div>
                <div class="signoff-line"></div>
                <div class="signoff-name">Municipal Agriculture Officer (MAO)</div>
                <div class="signoff-role">Municipal Agriculture Office &bull; LGU Virac, Catanduanes</div>
            </td>
        </tr>
    </table>

    <!-- ── Footer ── -->
    <div class="report-footer">
        <div>
            This document contains official municipal animal adoption records generated via <strong>FurFect Match System</strong>.
        </div>
        <div>
            In compliance with the Animal Welfare Act (RA 8485) and the Anti-Rabies Act (RA 9482) &bull; Municipality of Virac, Catanduanes.
        </div>
        <div style="margin-top: 2px;">
            &copy; {{ date('Y') }} FurFect Match &mdash; Virac Municipal Animal Shelter &amp; MAO. All rights reserved.
        </div>
    </div>

    <!-- ── Dompdf Dynamic Page Numbering ── -->
    <script type="text/php">
        if (isset($pdf)) {
            $text = "Page " . $PAGE_NUM . " of " . $PAGE_COUNT;
            $font = $fontMetrics->getFont("DejaVu Sans", "normal");
            if (!$font) {
                $font = $fontMetrics->getFont("Helvetica", "normal");
            }
            $size = 7.5;
            $color = array(0.5, 0.5, 0.5);
            $y = $pdf->get_height() - 22;
            $x = $pdf->get_width() - 85;
            $pdf->text($x, $y, $text, $font, $size, $color);
        }
    </script>
</body>
</html>
