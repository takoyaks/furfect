import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw, Calendar, Filter } from 'lucide-react';

export interface ReportFilterState {
    search?: string;
    status?: string;
    shelter_id?: string;
    species?: string;
    score_range?: string;
    date_preset?: string;
    date_from?: string;
    date_to?: string;
    date_field?: string;
    sort_by?: string;
    sort_dir?: string;
}

interface ShelterOption {
    id: number;
    name: string;
}

interface ReportFilterBarProps {
    baseUrl: string;
    filters: ReportFilterState;
    shelters?: ShelterOption[];
    showShelterFilter?: boolean;
    activeFilterDescriptions?: Record<string, string>;
}

export default function ReportFilterBar({
    baseUrl,
    filters,
    shelters = [],
    showShelterFilter = true,
    activeFilterDescriptions = {},
}: ReportFilterBarProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [shelterId, setShelterId] = useState(filters.shelter_id || 'all');
    const [species, setSpecies] = useState(filters.species || 'all');
    const [scoreRange, setScoreRange] = useState(filters.score_range || 'all');
    const [datePreset, setDatePreset] = useState(filters.date_preset || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    useEffect(() => {
        setSearch(filters.search || '');
        setStatus(filters.status || 'all');
        setShelterId(filters.shelter_id || 'all');
        setSpecies(filters.species || 'all');
        setScoreRange(filters.score_range || 'all');
        setDatePreset(filters.date_preset || 'all');
        setDateFrom(filters.date_from || '');
        setDateTo(filters.date_to || '');
    }, [filters]);

    const executeFilter = (overrides: Partial<ReportFilterState> = {}) => {
        const nextParams: Record<string, string> = {
            search: search.trim(),
            status: status !== 'all' ? status : '',
            shelter_id: shelterId !== 'all' ? shelterId : '',
            species: species !== 'all' ? species : '',
            score_range: scoreRange !== 'all' ? scoreRange : '',
            date_preset: datePreset !== 'all' ? datePreset : '',
            date_from: dateFrom,
            date_to: dateTo,
            ...overrides,
        };

        const cleaned: Record<string, string> = {};
        Object.entries(nextParams).forEach(([key, val]) => {
            if (val && val !== 'all') {
                cleaned[key] = val;
            }
        });

        router.get(baseUrl, cleaned, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeFilter();
    };

    const handlePresetChange = (preset: string) => {
        setDatePreset(preset);
        if (preset !== 'custom') {
            setDateFrom('');
            setDateTo('');
            executeFilter({ date_preset: preset, date_from: '', date_to: '' });
        }
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setShelterId('all');
        setSpecies('all');
        setScoreRange('all');
        setDatePreset('all');
        setDateFrom('');
        setDateTo('');

        router.get(baseUrl, {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const activeFilterCount = Object.keys(activeFilterDescriptions).length;

    return (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-center">
                <form onSubmit={handleSearchSubmit} className="sm:col-span-2 lg:col-span-2 flex gap-2">
                    <Input
                        type="text"
                        placeholder="Search ref #, adopter, pet..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="h-9 text-xs"
                    />
                    <Button type="submit" size="sm" variant="outline" className="h-9 text-xs px-3">
                        Filter
                    </Button>
                </form>

                <div>
                    <Select
                        value={status}
                        onValueChange={(val) => {
                            setStatus(val);
                            executeFilter({ status: val === 'all' ? '' : val });
                        }}
                    >
                        <SelectTrigger size="sm" className="h-9 text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="mao_audit">MAO Audit</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {showShelterFilter ? (
                    <div>
                        <Select
                            value={shelterId}
                            onValueChange={(val) => {
                                setShelterId(val);
                                executeFilter({ shelter_id: val === 'all' ? '' : val });
                            }}
                        >
                            <SelectTrigger size="sm" className="h-9 text-xs">
                                <SelectValue placeholder="Shelter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Shelters</SelectItem>
                                {shelters.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div>
                        <Select
                            value={species}
                            onValueChange={(val) => {
                                setSpecies(val);
                                executeFilter({ species: val === 'all' ? '' : val });
                            }}
                        >
                            <SelectTrigger size="sm" className="h-9 text-xs">
                                <SelectValue placeholder="Pet Species" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Species</SelectItem>
                                <SelectItem value="dog">Dogs</SelectItem>
                                <SelectItem value="cat">Cats</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div>
                    <Select
                        value={scoreRange}
                        onValueChange={(val) => {
                            setScoreRange(val);
                            executeFilter({ score_range: val === 'all' ? '' : val });
                        }}
                    >
                        <SelectTrigger size="sm" className="h-9 text-xs">
                            <SelectValue placeholder="DSS Score" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Scores</SelectItem>
                            <SelectItem value="high">High Match (≥80%)</SelectItem>
                            <SelectItem value="moderate">Moderate (50% - 79%)</SelectItem>
                            <SelectItem value="low">Low (&lt;50%)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-gray-400 font-medium flex items-center gap-1 mr-1">
                        <Calendar className="h-3.5 w-3.5" /> Date:
                    </span>
                    {[
                        { label: 'All Time', val: 'all' },
                        { label: 'Today', val: 'today' },
                        { label: 'This Week', val: 'this_week' },
                        { label: 'This Month', val: 'this_month' },
                        { label: 'Last Month', val: 'last_month' },
                        { label: 'This Year', val: 'this_year' },
                        { label: 'Custom', val: 'custom' },
                    ].map((preset) => (
                        <button
                            key={preset.val}
                            type="button"
                            onClick={() => handlePresetChange(preset.val)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                                datePreset === preset.val
                                    ? 'bg-[#D4A017] text-white shadow-2xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {datePreset === 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-8 text-xs w-36"
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-8 text-xs w-36"
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => executeFilter({ date_preset: 'custom', date_from: dateFrom, date_to: dateTo })}
                            className="h-8 text-xs"
                        >
                            Apply
                        </Button>
                    </div>
                )}

                {showShelterFilter && (
                    <div className="w-36">
                        <Select
                            value={species}
                            onValueChange={(val) => {
                                setSpecies(val);
                                executeFilter({ species: val === 'all' ? '' : val });
                            }}
                        >
                            <SelectTrigger size="sm" className="h-8 text-xs">
                                <SelectValue placeholder="Species" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Species</SelectItem>
                                <SelectItem value="dog">Dogs</SelectItem>
                                <SelectItem value="cat">Cats</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                        <Filter className="h-3 w-3 text-[#D4A017]" /> Active filters ({activeFilterCount}):
                    </span>
                    {Object.entries(activeFilterDescriptions).map(([key, label]) => (
                        <span
                            key={key}
                            className="inline-flex items-center gap-1 bg-[#FFFDF5] border border-[#F5EDD7] text-[#8C6A0A] px-2 py-0.5 rounded text-[11px] font-medium"
                        >
                            <span className="font-semibold">{key}:</span> {label}
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 ml-auto text-xs font-semibold cursor-pointer underline"
                    >
                        <RotateCcw className="h-3 w-3" /> Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
}
