using Hex.Configs;
using Hex.Session.UI;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhSquadValueWindowItem : MonoBehaviour, IPointerEnterHandler, IEventSystemHandler, IPointerDownHandler, IPointerExitHandler
	{
		[SerializeField]
		private BhScaleAnim scale;

		[SerializeField]
		private Image pic;

		[SerializeField]
		private TextMeshProUGUI title;

		[SerializeField]
		private TextMeshProUGUI value;

		[SerializeField]
		private GameObject checkmark;

		private SquadConfig buyb;

		private BhSquadValueWindow buyc;

		public string cmpm => null;

		public void Init(SquadConfig _squadConfig, BhSquadValueWindow _squadWindow)
		{
		}

		public void nyg(bool a)
		{
		}

		public void OnClick()
		{
		}

		public void OnPointerDown(PointerEventData eventData)
		{
		}

		public void OnPointerEnter(PointerEventData eventData)
		{
		}

		public void OnPointerExit(PointerEventData eventData)
		{
		}
	}
}
