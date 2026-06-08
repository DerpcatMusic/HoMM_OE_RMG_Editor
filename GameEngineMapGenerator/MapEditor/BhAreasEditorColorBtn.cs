using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhAreasEditorColorBtn : MonoBehaviour, IPointerClickHandler, IEventSystemHandler
	{
		[SerializeField]
		private Image imageColor;

		private BhAreasEditorView bugn;

		private int bugo;

		public void ndt(BhAreasEditorView a, int b, Color c)
		{
		}

		public void OnPointerClick(PointerEventData eventData)
		{
		}
	}
}
