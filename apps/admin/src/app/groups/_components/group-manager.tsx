'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { distributeUserGroups, updateUserGroup } from '../actions';
import { Icons } from '@/components/icons';

type RowStatus = 'idle' | 'loading' | 'success' | 'failure';

export function GroupManager({ users }) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupCount, setGroupCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>(
    {},
  );
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});

  const handleUpdateUser = async (userId: string) => {
    const newGroup = pendingChanges[userId];
    if (!newGroup) return;

    setRowStatus((prev) => ({ ...prev, [userId]: 'loading' }));
    try {
      await updateUserGroup({ userId, newGroup });
      setRowStatus((prev) => ({ ...prev, [userId]: 'success' }));
    } catch (e) {
      setRowStatus((prev) => ({ ...prev, [userId]: 'failure' }));
      console.error(e);
    }
    setTimeout(
      () => setRowStatus((prev) => ({ ...prev, [userId]: 'idle' })),
      2000,
    );
  };

  const groupOptions = useMemo(
    () => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
    [],
  );

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedUserIds);
    checked ? newSet.add(userId) : newSet.delete(userId);
    setSelectedUserIds(newSet);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      const result = await distributeUserGroups({
        userIds: Array.from(selectedUserIds),
        groupCount,
      });
      setFeedback(result.message);
      setTimeout(() => {
        setIsDialogOpen(false);
        setFeedback('');
        setSelectedUserIds(new Set()); // Clear selection on success
      }, 2000);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isAllSelected = useMemo(
    () => selectedUserIds.size > 0 && selectedUserIds.size === users.length,
    [selectedUserIds, users],
  );
  const isSomeSelected = useMemo(
    () => selectedUserIds.size > 0 && !isAllSelected,
    [selectedUserIds, isAllSelected],
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={selectedUserIds.size === 0}
        >
          Distribute {selectedUserIds.size} Users
        </Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    isAllSelected
                      ? true
                      : isSomeSelected
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Group</TableHead>
              <TableHead>Change Group</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUserIds.has(user.id)}
                    onCheckedChange={(checked) =>
                      handleSelectUser(user.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.group || 'N/A'}</TableCell>
                <TableCell className="w-[150px]">
                  <Select
                    defaultValue={user.group}
                    onValueChange={(value) =>
                      setPendingChanges((prev) => ({
                        ...prev,
                        [user.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map((group) => (
                        <SelectItem key={group} value={group}>
                          Group {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right w-[100px]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateUser(user.id)}
                    disabled={
                      !pendingChanges[user.id] ||
                      pendingChanges[user.id] === user.group ||
                      rowStatus[user.id] === 'loading'
                    }
                  >
                    {rowStatus[user.id] === 'loading' && (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    )}
                    {rowStatus[user.id] === 'success' && (
                      <Icons.checkCircle className="h-4 w-4 text-green-500" />
                    )}
                    {rowStatus[user.id] === 'failure' && (
                      <Icons.xCircle className="h-4 w-4 text-red-500" />
                    )}
                    {(!rowStatus[user.id] || rowStatus[user.id] === 'idle') &&
                      'Save'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Users into Groups</DialogTitle>
            <DialogDescription>
              Assign {selectedUserIds.size} users into a number of groups (A-Z).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="groupCount">Number of Groups (1-26)</Label>
            <Input
              id="groupCount"
              type="number"
              min="1"
              max="26"
              value={groupCount}
              onChange={(e) =>
                setGroupCount(Math.max(1, Math.min(26, Number(e.target.value))))
              }
            />
          </div>
          <DialogFooter>
            {feedback && <p className="text-sm mr-auto">{feedback}</p>}
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign Groups'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
