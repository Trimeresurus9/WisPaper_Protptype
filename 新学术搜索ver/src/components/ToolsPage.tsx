import React from 'react';
import { ArrowRight, BarChart3, FileCheck2, FileImage, FileSpreadsheet, Upload } from 'lucide-react';

interface ToolsPageProps {
  onOpenTrueCite: () => void;
  onOpenFigureToPPTX: () => void;
  onOpenFigureToExcel: () => void;
  onOpenExcelToFigure: () => void;
}

export function ToolsPage({ onOpenTrueCite, onOpenFigureToPPTX, onOpenFigureToExcel, onOpenExcelToFigure }: ToolsPageProps) {
  return (
    <main className="min-h-screen flex-1 overflow-y-auto bg-[#f7f9fc] px-8 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold text-blue-600">WisPaper Tools</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">科研工具</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">把高频、独立的科研处理能力集中在一个地方。</p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          <button onClick={onOpenTrueCite} className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><FileCheck2 className="h-6 w-6" /></div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">打开 TrueCite <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-950">TrueCite</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">上传您的 Bib，自动检测幻觉引用。</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"><Upload className="h-3.5 w-3.5" />支持 .bib 文件</div>
          </button>

          <button onClick={onOpenFigureToPPTX} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><FileImage className="h-6 w-6" /></div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600">打开 Fig2PPT <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-950">Fig2PPT</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">从 PDF 中提取 Figure，并自动转化为可编辑的 PPT 格式。</p>
            <span className="mt-5 inline-flex rounded-xl bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700">开始转换</span>
          </button>

          <button onClick={onOpenFigureToExcel} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-6 w-6" /></div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">打开 Fig2Excel <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-950">Fig2Excel</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">框选 PDF 中的表格，识别行列结构并转换为可编辑的 Excel。</p>
            <span className="mt-5 inline-flex rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">开始转换</span>
          </button>

          <button onClick={onOpenExcelToFigure} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg">
            <div className="flex items-start justify-between gap-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><BarChart3 className="h-6 w-6" /></div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700">打开 Excel2fig <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-950">Excel2fig</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">上传 CSV、XLSX 或 JSON，用 Prompt 将数据生成适合论文与汇报的图片。</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex rounded-xl bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-800">数据生成图表</span>
              <span className="inline-flex rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">支持参考图</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
