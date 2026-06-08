using UnityEngine;
using UnityEngine.EventSystems;

namespace Hex.MapEditor
{
	public class BhMasterVariant : MonoBehaviour, IPointerClickHandler, IEventSystemHandler
	{
		[SerializeField]
		private BhEditorListMasterButton to;

		[SerializeField]
		private BhEditorListMasterButton alt;

		[SerializeField]
		private BhToolVariants variants;

		public void OnPointerClick(PointerEventData eventData)
		{
		}

		public void Select()
		{
		}
	}
}
