import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, Edit2, Plus, Check, Lock, Unlock, Palette } from 'lucide-react';
import { Category } from '../types';
import Icon from './Icon';
import IconSelector from './IconSelector';
import CategoryActionAuthModal from './CategoryActionAuthModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
  onDeleteCategory: (id: string) => void;
  onVerifyPassword?: (password: string) => Promise<boolean>;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  onDeleteCategory,
  onVerifyPassword
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editParentId, setEditParentId] = useState<string>('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatPassword, setNewCatPassword] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Folder');
  const [newCatParentId, setNewCatParentId] = useState<string>('');

  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [iconSelectorTarget, setIconSelectorTarget] = useState<'edit' | 'new' | null>(null);

  // 分类操作验证相关状态
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasVerifiedPermissions, setHasVerifiedPermissions] = useState(false); // 跟踪是否已验证过权限
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    categoryId: string;
    categoryName: string;
  } | null>(null);

  if (!isOpen) return null;

  // 获取顶级分类（不包含子分类）
  const getTopLevelCategories = () => {
    return categories.filter(cat => !cat.isSubcategory && !cat.parentId);
  };

  // 获取可选择的父分类（排除自己和自己的子分类）
  const getParentOptions = (excludeId?: string) => {
    return categories.filter(cat => {
      if (cat.id === excludeId) return false; // 不能选择自己作为父分类
      if (cat.isSubcategory || cat.parentId) return false; // 只有顶级分类可以作为父分类
      if (excludeId) {
        // 检查是否会形成循环引用
        const isDescendant = (parentId: string, childId: string): boolean => {
          const parent = categories.find(c => c.id === parentId);
          if (!parent) return false;
          if (parent.parentId === childId) return true;
          return parent.parentId ? isDescendant(parent.parentId, childId) : false;
        };
        return !isDescendant(cat.id, excludeId);
      }
      return true;
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
    }
    onUpdateCategories(newCats);
  };

  // 处理密码验证
  const handlePasswordVerification = async (password: string): Promise<boolean> => {
    if (!onVerifyPassword) return true; // 如果没有提供验证函数，默认通过
    
    try {
      const isValid = await onVerifyPassword(password);
      return isValid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  // 处理编辑分类前的验证
  const handleStartEdit = (cat: Category) => {
    if (!onVerifyPassword || hasVerifiedPermissions) {
      // 如果没有提供验证函数或已验证过权限，直接编辑
      startEdit(cat);
      return;
    }

    // 设置待处理的操作
    setPendingAction({
      type: 'edit',
      categoryId: cat.id,
      categoryName: cat.name
    });

    // 打开验证弹窗
    setIsAuthModalOpen(true);
  };

  // 处理删除分类前的验证
  const handleDeleteClick = (cat: Category) => {
    if (!onVerifyPassword || hasVerifiedPermissions) {
      // 如果没有提供验证函数或已验证过权限，直接删除
      if (confirm(`确定删除"${cat.name}"分类吗？该分类下的书签将移动到"常用推荐"。`)) {
        onDeleteCategory(cat.id);
      }
      return;
    }

    // 设置待处理的操作
    setPendingAction({
      type: 'delete',
      categoryId: cat.id,
      categoryName: cat.name
    });

    // 打开验证弹窗
    setIsAuthModalOpen(true);
  };

  // 处理验证成功后的操作
  const handleAuthSuccess = () => {
    if (!pendingAction) return;

    // 设置已验证权限标志
    setHasVerifiedPermissions(true);

    if (pendingAction.type === 'edit') {
      const cat = categories.find(c => c.id === pendingAction.categoryId);
      if (cat) {
        startEdit(cat);
      }
    } else if (pendingAction.type === 'delete') {
      const cat = categories.find(c => c.id === pendingAction.categoryId);
      if (cat && confirm(`确定删除"${cat.name}"分类吗？该分类下的书签将移动到"常用推荐"。`)) {
        onDeleteCategory(cat.id);
      }
    }

    // 清除待处理的操作
    setPendingAction(null);
  };

  // 处理验证弹窗关闭
  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
    // 如果用户取消了验证，不保留权限状态
    // setHasVerifiedPermissions(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditPassword(cat.password || '');
    setEditIcon(cat.icon);
    setEditParentId(cat.parentId || '');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;

    const newCats = categories.map(c => {
      if (c.id === editingId) {
        const isSubcategory = !!editParentId;
        return {
          ...c,
          name: editName.trim(),
          icon: editIcon,
          password: editPassword.trim() || undefined,
          parentId: editParentId || undefined,
          isSubcategory
        };
      }
      return c;
    });

    onUpdateCategories(newCats);
    setEditingId(null);
    setEditParentId('');
  };

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      icon: newCatIcon,
      password: newCatPassword.trim() || undefined,
      parentId: newCatParentId || undefined,
      isSubcategory: !!newCatParentId
    };
    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatPassword('');
    setNewCatIcon('Folder');
    setNewCatParentId('');
  };

  const openIconSelector = (target: 'edit' | 'new') => {
    setIconSelectorTarget(target);
    setIsIconSelectorOpen(true);
  };
  
  const handleIconSelect = (iconName: string) => {
    if (iconSelectorTarget === 'edit') {
      setEditIcon(iconName);
    } else if (iconSelectorTarget === 'new') {
      setNewCatIcon(iconName);
    }
  };
  
  const cancelIconSelector = () => {
    setIsIconSelectorOpen(false);
    setIconSelectorTarget(null);
  };
  
  const cancelAdd = () => {
    setNewCatName('');
    setNewCatPassword('');
    setNewCatIcon('Folder');
    setNewCatParentId('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white">分类管理</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(() => {
            // 构建层次结构
            const topLevelCategories = categories.filter(cat => !cat.isSubcategory && !cat.parentId);
            const renderCategoryWithChildren = (category: Category, level: number = 0) => {
              const children = categories.filter(cat => cat.parentId === category.id);
              const categoryIndex = categories.findIndex(c => c.id === category.id);

              return (
                <React.Fragment key={category.id}>
                  <div className={`flex flex-col p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group gap-2 ${level > 0 ? 'ml-6' : ''}`}>
                    <div className="flex items-center gap-2">
                      {/* Order Controls - 只对同级分类显示 */}
                      <div className="flex flex-col gap-1 mr-2">
                        <button
                          onClick={() => handleMove(categoryIndex, 'up')}
                          disabled={categoryIndex === 0}
                          className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMove(categoryIndex, 'down')}
                          disabled={categoryIndex === categories.length - 1}
                          className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId === category.id && category.id !== 'common' ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Icon name={editIcon} size={16} />
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 p-1.5 px-2 text-sm rounded border border-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                                placeholder="分类名称"
                                autoFocus
                              />
                              <button
                                type="button"
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                onClick={() => openIconSelector('edit')}
                                title="选择图标"
                              >
                                <Palette size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-500">父分类:</label>
                              <select
                                value={editParentId}
                                onChange={(e) => setEditParentId(e.target.value)}
                                className="flex-1 p-1.5 px-2 text-sm rounded border border-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                                aria-label="选择父分类"
                              >
                                <option value="">顶级分类</option>
                                {getParentOptions(category.id).map(parent => (
                                  <option key={parent.id} value={parent.id}>
                                    作为 "{parent.name}" 的子分类
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Lock size={14} className="text-slate-400" />
                              <input
                                type="password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="flex-1 p-1.5 px-2 text-sm rounded border border-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                                placeholder="密码（可选）"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {category.isSubcategory && (
                              <div className="w-2 border-l-2 border-slate-300 dark:border-slate-600 ml-2"></div>
                            )}
                            <Icon name={category.icon} size={16} />
                            <span className="font-medium dark:text-slate-200 truncate">
                              {category.isSubcategory && <span className="text-slate-400 mr-1">└</span>}
                              {category.name}
                              {category.id === 'common' && (
                                <span className="ml-2 text-xs text-slate-400">(默认分类，不可编辑)</span>
                              )}
                            </span>
                            {category.password && (
                              <Lock size={12} className="text-slate-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 self-start mt-1">
                        {editingId === category.id ? (
                          <button onClick={saveEdit} className="text-green-500 hover:bg-green-50 dark:hover:bg-slate-600 p-1.5 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600">
                            <Check size={16} />
                          </button>
                        ) : (
                          <>
                            {category.id !== 'common' && (
                              <button onClick={() => handleStartEdit(category)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                                <Edit2 size={14} />
                              </button>
                            )}
                            {category.id !== 'common' && (
                              <button
                                onClick={() => handleDeleteClick(category)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            {category.id === 'common' && (
                              <div className="p-1.5 text-slate-300" title="常用推荐分类不能被删除">
                                <Lock size={14} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 递归渲染子分类 */}
                  {children.map(child => renderCategoryWithChildren(child, level + 1))}
                </React.Fragment>
              );
            };

            return topLevelCategories.map(cat => renderCategoryWithChildren(cat));
          })()}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
           <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">添加新分类</label>
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
               <Icon name={newCatIcon} size={16} />
               <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="分类名称"
                  className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
               <button
                 type="button"
                 className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                 onClick={() => openIconSelector('new')}
                 title="选择图标"
               >
                 <Palette size={16} />
               </button>
             </div>
             <div className="flex items-center gap-2">
               <label className="text-xs text-slate-500">父分类:</label>
               <select
                 value={newCatParentId}
                 onChange={(e) => setNewCatParentId(e.target.value)}
                 className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 aria-label="选择父分类"
               >
                 <option value="">顶级分类</option>
                 {getParentOptions().map(parent => (
                   <option key={parent.id} value={parent.id}>
                     作为 "{parent.name}" 的子分类
                   </option>
                 ))}
               </select>
             </div>
             <div className="flex gap-2">
                 <div className="flex-1 relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        value={newCatPassword}
                        onChange={(e) => setNewCatPassword(e.target.value)}
                        placeholder="密码 (可选)"
                        className="w-full pl-8 p-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                 </div>
                 <button 
                    onClick={handleAdd}
                    disabled={!newCatName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                 >
                   <Plus size={18} />
                 </button>
             </div>
           </div>
        </div>

        {/* 图标选择器弹窗 */}
        {isIconSelectorOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">选择图标</h3>
                <button
                  type="button"
                  onClick={cancelIconSelector}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="关闭图标选择器"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <IconSelector
                  onSelectIcon={(iconName) => {
                    handleIconSelect(iconName);
                    setIsIconSelectorOpen(false);
                    setIconSelectorTarget(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 分类操作密码验证弹窗 */}
        {isAuthModalOpen && pendingAction && (
          <CategoryActionAuthModal
            isOpen={isAuthModalOpen}
            onClose={handleAuthModalClose}
            onVerify={handlePasswordVerification}
            onVerified={handleAuthSuccess}
            actionType={pendingAction.type}
            categoryName={pendingAction.categoryName}
          />
        )}
        </div>
      </div>

    </>
  );
};

export default CategoryManagerModal;