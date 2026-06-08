using UnityEngine;
using UnityEngine.EventSystems;

namespace Hex.MapEditor
{
	public class BhToolVariant : MonoBehaviour, IPointerClickHandler, IEventSystemHandler
	{
		[SerializeField]
		private BhEditorToolButton to;

		[SerializeField]
		private BhEditorToolButton alt;

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
