import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { ScreenSpinner } from "../components/ScreenSpinnerProps";
import { DockMenu } from "../components/DockMenu";
import Circles from "../components/Circles";
import { MonthGrid } from "../components/lists/MonthGrid";
import { ProgressBar } from "../components/lists/ProgressBar";
import type { ListDetail } from "../interfaces/lists.interfaces";
import { formatRange, todayISO } from "../utils/datesUtils";
import { getMenuItems } from "../utils/globalUtils";
import { ArrowLeftIcon } from "../utils/iconsUtils";


const ListDays = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { requestAuth } = useApi();

    const [list, setList] = useState<ListDetail | null>(null);
    const [firstLoad, setFirstLoad] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await requestAuth<ListDetail>(`/api/lists/${id}`, { method: "GET" });
            setFirstLoad(false);
            if (data) setList(data);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (firstLoad) return <div className="h-screen"><ScreenSpinner /></div>;

    const today = list?.days.find((d) => d.task_date === todayISO());

    return (
        <>
            <div className="page-bg">
                <Circles />
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">

                <DockMenu items={getMenuItems(navigate)} />

                {!list ? (
                    <p className="text-center text-[#A7B5AD]">List not found</p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => navigate("/lists")}
                                    className="mb-1 text-xs text-[#A7B5AD] transition hover:text-[#F2F2F2] flex items-center cursor-pointer"
                                >
                                    <ArrowLeftIcon />
                                    <span className="ml-2 text-2xl">All lists</span>
                                </button>
                                <p className="text-3xl">{list.title}</p>
                                <p className="text-sm text-[#A7B5AD]">{formatRange(list.start_date, list.end_date)}</p>
                            </div>

                            <button
                                type="button"
                                disabled={!today}
                                onClick={() => today && navigate(`/lists/${list.id}/days/${today.id}`)}
                                className="rounded-lg border border-[#8FD3AE]/40 bg-[#8FD3AE]/10 px-4 py-2 text-sm text-[#8FD3AE] transition hover:bg-[#8FD3AE]/20 disabled:opacity-40"
                            >
                                Today
                            </button>
                        </div>

                        <div className="glass p-4">
                            <ProgressBar done={list.done_count} total={list.tasks_count} />
                        </div>

                        <MonthGrid
                            days={list.days}
                            onSelect={(d) => navigate(`/lists/${list.id}/days/${d.id}`)}
                        />
                    </>
                )}
            </main>
        </>
    );
};

export default ListDays;