<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            line-height: 1.4;
            font-size: 12px;
        }
        .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #D4A017;
            padding-bottom: 10px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #D4A017;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            color: #444444;
        }
        .meta {
            margin-top: 5px;
            color: #777777;
        }
        .summary-box {
            background-color: #F9F9F9;
            border: 1px solid #EAEAEA;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .summary-box table {
            width: 100%;
        }
        .summary-box td {
            font-size: 14px;
        }
        .summary-val {
            font-weight: bold;
            color: #D4A017;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        table.data-table th {
            background-color: #F5EDD7;
            color: #555555;
            font-weight: bold;
            text-align: left;
            padding: 8px;
            border: 1px solid #EAEAEA;
        }
        table.data-table td {
            padding: 8px;
            border: 1px solid #EAEAEA;
        }
        .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-approved { background-color: #D4EDDA; color: #155724; }
        .badge-rejected { background-color: #F8D7DA; color: #721C24; }
        .badge-pending { background-color: #FFF3CD; color: #856404; }
        .badge-review { background-color: #CCE5FF; color: #004085; }
        .badge-audit { background-color: #E2E3E5; color: #383D41; }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #999999;
            font-size: 10px;
            border-top: 1px solid #EEEEEE;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🐾 FurFect Match</div>
        <div class="title">{{ $title }}</div>
        <div class="meta">Generated on {{ $date }} | Virac Animal Shelter & Municipal Agriculture Office</div>
    </div>

    <div class="summary-box">
        <table>
            <tr>
                <td>Total Applications: <span class="summary-val">{{ $total }}</span></td>
                <td>Approved: <span class="summary-val">{{ $approved }}</span></td>
                <td>Rejected: <span class="summary-val">{{ $rejected }}</span></td>
                <td>Pending Action: <span class="summary-val">{{ $pending }}</span></td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th>Reference No</th>
                <th>Adopter</th>
                <th>Pet</th>
                <th>Shelter</th>
                <th>DSS Score</th>
                <th>Status</th>
                <th>Date Applied</th>
            </tr>
        </thead>
        <tbody>
            @foreach($applications as $app)
                <tr>
                    <td><strong>{{ $app->reference_number }}</strong></td>
                    <td>{{ $app->adopter->name }}</td>
                    <td>{{ $app->pet->name }} ({{ ucfirst($app->pet->species) }})</td>
                    <td>{{ $app->pet->shelter->name }}</td>
                    <td style="text-align: right;">{{ $app->dss_score }}%</td>
                    <td>
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
                    <td>{{ $app->submitted_at ? $app->submitted_at->format('Y-m-d') : '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        © {{ date('Y') }} FurFect Match Pet Adoption System. All rights reserved.
    </div>
</body>
</html>
