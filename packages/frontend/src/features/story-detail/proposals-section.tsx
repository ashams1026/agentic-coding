import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useProposals, useUpdateProposal } from "@/hooks";
import type { Story, Proposal, ProposalId } from "@agentops/shared";

// ── Proposed task item ──────────────────────────────────────────

interface ProposedTaskProps {
  title: string;
  description: string;
}

function ProposedTask({ title, description }: ProposedTaskProps) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

// ── Single proposal card ────────────────────────────────────────

interface ProposalCardProps {
  proposal: Proposal;
  onApprove: (id: ProposalId) => void;
  onReject: (id: ProposalId, feedback: string) => void;
}

function ProposalCard({ proposal, onApprove, onReject }: ProposalCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [expanded, setExpanded] = useState(true);

  const tasks = (proposal.payload.tasks ?? []) as Array<{
    title: string;
    description: string;
  }>;

  const handleReject = () => {
    if (!feedback.trim()) return;
    onReject(proposal.id, feedback.trim());
    setShowRejectForm(false);
    setFeedback("");
  };

  return (
    <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium">
            {proposal.type === "task_creation"
              ? `${tasks.length} proposed task${tasks.length !== 1 ? "s" : ""}`
              : "Proposal"}
          </span>
          <Badge
            variant="outline"
            className="text-xs border-amber-400 text-amber-700 dark:text-amber-300"
          >
            pending
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {expanded && (
        <>
          {/* Task list */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <ProposedTask
                  key={i}
                  title={task.title}
                  description={task.description}
                />
              ))}
            </div>
          )}

          {/* Reject feedback form */}
          {showRejectForm && (
            <div className="space-y-2 pt-1">
              <Textarea
                autoFocus
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain why this proposal is being rejected..."
                className="min-h-[80px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowRejectForm(false);
                    setFeedback("");
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowRejectForm(false);
                    setFeedback("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleReject}
                  disabled={!feedback.trim()}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Confirm Reject
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showRejectForm && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onApprove(proposal.id)}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Reject
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface ProposalsSectionProps {
  story: Story;
}

export function ProposalsSection({ story }: ProposalsSectionProps) {
  const { data: proposals = [] } = useProposals(story.id);
  const updateProposal = useUpdateProposal();

  const pendingProposals = proposals.filter((p) => p.status === "pending");

  // Don't render if no pending proposals
  if (pendingProposals.length === 0) return null;

  const handleApprove = (id: ProposalId) => {
    updateProposal.mutate({ id, status: "approved" });
  };

  const handleReject = (id: ProposalId, feedback: string) => {
    updateProposal.mutate({ id, status: "rejected", feedback });
  };

  const handleApproveAll = () => {
    for (const p of pendingProposals) {
      updateProposal.mutate({ id: p.id, status: "approved" });
    }
  };

  return (
    <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10">
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium">
              {pendingProposals.length} Pending Proposal{pendingProposals.length !== 1 ? "s" : ""}
            </p>
          </div>
          {pendingProposals.length > 1 && (
            <Button
              size="sm"
              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApproveAll}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Approve all
            </Button>
          )}
        </div>

        {/* Proposal cards */}
        <div className="space-y-3">
          {pendingProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
