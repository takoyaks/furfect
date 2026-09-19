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
            font-size: 11px;
            margin: 0;
            padding: 10px;
        }
        .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #D4A017;
            padding-bottom: 10px;
        }
        .logo {
            font-size: 22px;
            font-weight: bold;
            color: #D4A017;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            margin-top: 6px;
            color: #333333;
        }
        .meta {
            margin-top: 4px;
            color: #777777;
            font-size: 10px;
        }
        .filter-banner {
            background-color: #FFFDF5;
            border: 1px solid #F5EDD7;
            border-left: 3px solid #D4A017;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 10.5px;
            color: #555555;
        }
        .filter-tag {
            display: inline-block;
            background-color: #F5EDD7;
            color: #8C6A0A;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
            margin-right: 6px;
        }
        .summary-box {
            background-color: #FAFAFA;
            border: 1px solid #EAEAEA;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 20px;
        }
        .summary-box table {
            width: 100%;
        }
        .summary-box td {
            font-size: 12px;
            padding: 4px 6px;
        }
        .summary-val {
            font-weight: bold;
            color: #D4A017;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.data-table th {
            background-color: #F8F4E8;
            color: #555555;
            font-weight: bold;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #E5E5E5;
            font-size: 10px;
            text-transform: uppercase;
        }
        table.data-table td {
            padding: 6px 8px;
            border: 1px solid #EAEAEA;
            font-size: 10.5px;
        }
        table.data-table tr:nth-child(even) {
            background-color: #FAFAFA;
        }
        .badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-approved { background-color: #D4EDDA; color: #155724; }
        .badge-rejected { background-color: #F8D7DA; color: #721C24; }
        .badge-pending { background-color: #FFF3CD; color: #856404; }
        .badge-review { background-color: #CCE5FF; color: #004085; }
        .badge-audit { background-color: #E2E3E5; color: #383D41; }
        .footer {
            margin-top: 35px;
            text-align: center;
            color: #999999;
            font-size: 9px;
            border-top: 1px solid #EEEEEE;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🐾 FurFect Match</div>
        <div class="title">{{ $title }}</div>
        <div class="meta">Generated on {{ $date }} | Virac Animal Shelter &amp; Municipal Agriculture Office</div>
    </div>

    @if(!empty($activeFilters))
        <div class="filter-banner">
            <strong>Active Filter Criteria:</strong>
            @foreach($activeFilters as $key => $val)
                <span class="filter-tag">{{ $key }}: {{ $val }}</span>
            @endforeach
        </div>
    @endif

    <div class="summary-box">
        <table>
            <tr>
                <td>Total Applications: <span class="summary-val">{{ $total }}</span></td>
                <td>Approved: <span class="summary-val">{{ $approved }} ({{ $approval_rate ?? 0 }}%)</span></td>
                <td>Rejected: <span class="summary-val">{{ $rejected }}</span></td>
                <td>Pending Action: <span class="summary-val">{{ $pending }}</span></td>
                @if(isset($avg_score))
                    <td>Avg DSS Score: <span class="summary-val">{{ $avg_score }}%</span></td>
                @endif
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th>Ref #</th>
                <th>Adopter</th>
                <th>Pet</th>
                <th>Shelter</th>
                <th style="text-align: right;">DSS Score</th>
                <th>Status</th>
                <th>Date Applied</th>
            </tr>
        </thead>
        <tbody>
            @forelse($applications as $app)
                <tr>
                    <td><strong>{{ $app->reference_number }}</strong></td>
                    <td>
                        {{ $app->adopter?->name ?? 'N/A' }}<br>
                        <span style="color: #888; font-size: 9px;">{{ $app->adopter?->email ?? '' }}</span>
                    </td>
                    <td>
                        {{ $app->pet?->name ?? 'N/A' }} 
                        <span style="color: #888; font-size: 9.5px;">({{ ucfirst((string) ($app->pet?->species ?? '')) }})</span>
                    </td>
                    <td>{{ $app->pet?->shelter?->name ?? 'N/A' }}</td>
                    <td style="text-align: right; font-weight: bold; color: {{ ($app->dss_score >= 80) ? '#28a745' : (($app->dss_score >= 50) ? '#d39e00' : '#dc3545') }};">
                        {{ $app->dss_score }}%
                    </td>
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
                    <td>{{ $app->submitted_at ? $app->submitted_at->format('Y-m-d') : '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; color: #888; padding: 20px;">
                        No applications matched the specified filter criteria.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        © {{ date('Y') }} FurFect Match — Virac Municipal Animal Adoption System. All rights reserved.
    </div>
</body>
</html>
