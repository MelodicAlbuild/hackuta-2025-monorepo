"use client";
import { useState } from "react";
import { bulkSetPoints } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BulkActions() {
  const [amount, setAmount] = useState(0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Bulk Actions</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Set Points</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Set all to..."
          />
          <Button onClick={() => bulkSetPoints(amount)}>Set All</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
