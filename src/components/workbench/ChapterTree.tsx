import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, FolderOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { BlueChapter } from '@/types/chapter';

interface ChapterTreeProps {
  chapters: BlueChapter[];
  selectedChapterId?: string;
  selectedSubChapterId?: string;
  selectedRangeId?: string;
  onSelectChapter: (chapterId: string) => void;
  onSelectSubChapter: (subChapterId: string) => void;
  onSelectRange: (rangeId: string) => void;
  onCreateChapter: (name: string) => void;
  onCreateSubChapter: (parentId: string, name: string) => void;
  onCreateRange: (subChapterId: string, name: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onDeleteSubChapter: (subChapterId: string) => void;
  onDeleteRange: (rangeId: string) => void;
}

const ChapterTree = ({
  chapters,
  selectedChapterId,
  selectedSubChapterId,
  selectedRangeId,
  onSelectChapter,
  onSelectSubChapter,
  onSelectRange,
  onCreateChapter,
  onCreateSubChapter,
  onCreateRange,
  onDeleteChapter,
  onDeleteSubChapter,
  onDeleteRange,
}: ChapterTreeProps) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSubChapters, setExpandedSubChapters] = useState<Set<string>>(new Set());
  
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: 'chapter' | 'subchapter' | 'range';
    parentId?: string;
  }>({ open: false, type: 'chapter' });
  
  const [newItemName, setNewItemName] = useState('');

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleSubChapter = (subChapterId: string) => {
    const newExpanded = new Set(expandedSubChapters);
    if (newExpanded.has(subChapterId)) {
      newExpanded.delete(subChapterId);
    } else {
      newExpanded.add(subChapterId);
    }
    setExpandedSubChapters(newExpanded);
  };

  const handleCreate = () => {
    if (!newItemName.trim()) return;

    switch (createDialog.type) {
      case 'chapter':
        onCreateChapter(newItemName);
        break;
      case 'subchapter':
        if (createDialog.parentId) {
          onCreateSubChapter(createDialog.parentId, newItemName);
        }
        break;
      case 'range':
        if (createDialog.parentId) {
          onCreateRange(createDialog.parentId, newItemName);
        }
        break;
    }

    setNewItemName('');
    setCreateDialog({ open: false, type: 'chapter' });
  };

  const getItemCount = (chapter: BlueChapter): number => {
    return chapter.subChapters.reduce((sum, sub) => 
      sum + sub.ranges.reduce((rangeSum, range) => 
        rangeSum + range.sapItemIds.length, 0
      ), 0
    );
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setCreateDialog({ open: true, type: 'chapter' })}
        className="w-full bg-[#0066B3] hover:bg-[#004C87]"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Blue Chapter
      </Button>

      <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {chapters.map((chapter) => (
          <div key={chapter.chapterId} className="space-y-1">
            <div
              className={`
                group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                ${selectedChapterId === chapter.chapterId 
                  ? 'bg-[#0066B3]/10 border border-[#0066B3]' 
                  : 'hover:bg-gray-50 border border-transparent'}
              `}
            >
              <button
                onClick={() => toggleChapter(chapter.chapterId)}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {expandedChapters.has(chapter.chapterId) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {expandedChapters.has(chapter.chapterId) ? (
                <FolderOpen className="h-4 w-4 text-[#0066B3]" />
              ) : (
                <Folder className="h-4 w-4 text-[#0066B3]" />
              )}

              <div onClick={() => onSelectChapter(chapter.chapterId)} className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{chapter.name}</div>
                <div className="text-xs text-gray-500">
                  {chapter.subChapters.length} sub • {getItemCount(chapter)} items
                </div>
              </div>

              <div className="hidden group-hover:flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreateDialog({ open: true, type: 'subchapter', parentId: chapter.chapterId });
                  }}
                  className="h-7 w-7 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${chapter.name}"?`)) {
                      onDeleteChapter(chapter.chapterId);
                    }
                  }}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>

            {expandedChapters.has(chapter.chapterId) && (
              <div className="ml-6 space-y-1">
                {chapter.subChapters.map((subChapter) => (
                  <div key={subChapter.subChapterId} className="space-y-1">
                    <div
                      className={`
                        group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                        ${selectedSubChapterId === subChapter.subChapterId 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-transparent'}
                      `}
                    >
                      <button
                        onClick={() => toggleSubChapter(subChapter.subChapterId)}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        {expandedSubChapters.has(subChapter.subChapterId) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <Folder className="h-4 w-4 text-blue-400" />

                      <div onClick={() => onSelectSubChapter(subChapter.subChapterId)} className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{subChapter.name}</div>
                        <div className="text-xs text-gray-500">{subChapter.ranges.length} ranges</div>
                      </div>

                      <div className="hidden group-hover:flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateDialog({ open: true, type: 'range', parentId: subChapter.subChapterId });
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${subChapter.name}"?`)) {
                              onDeleteSubChapter(subChapter.subChapterId);
                            }
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {expandedSubChapters.has(subChapter.subChapterId) && (
                      <div className="ml-6 space-y-1">
                        {subChapter.ranges.map((range) => (
                          <div
                            key={range.rangeId}
                            onClick={() => onSelectRange(range.rangeId)}
                            className={`
                              group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                              ${selectedRangeId === range.rangeId 
                                ? 'bg-blue-100 border border-blue-300' 
                                : 'hover:bg-gray-50 border border-transparent'}
                            `}
                          >
                            <FileText className="h-4 w-4 text-blue-500 ml-4" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-2">
                                <span className="truncate">{range.name}</span>
                                {range.isPublished && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    Published
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{range.sapItemIds.length} items</div>
                            </div>
                            <div className="hidden group-hover:flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete "${range.name}"?`)) {
                                    onDeleteRange(range.rangeId);
                                  }
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chapters yet</p>
            <p className="text-xs">Create your first blue chapter</p>
          </div>
        )}
      </div>

      <Dialog open={createDialog.open} onOpenChange={(open) => setCreateDialog({ ...createDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create {createDialog.type === 'chapter' ? 'Blue Chapter' : 
                       createDialog.type === 'subchapter' ? 'Sub-Chapter' : 'Range'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={
                  createDialog.type === 'chapter' ? 'Power Tools' :
                  createDialog.type === 'subchapter' ? 'Drills' : 'Cordless Drills 18V'
                }
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog({ open: false, type: 'chapter' })}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newItemName.trim()}
              className="bg-[#0066B3] hover:bg-[#004C87]"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterTree;
