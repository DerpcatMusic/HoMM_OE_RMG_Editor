using UnityEngine;

namespace Hex.MapEditor
{
	public class BhInfoView : MonoBehaviour
	{
		[SerializeField]
		private GameObject root;

		private float buqt;

		private float buqu;

		private float buqv;

		private int buqw;

		private void Awake()
		{
		}

		public virtual void Show()
		{
		}

		public virtual void Hide()
		{
		}

		public virtual void UpdateVal()
		{
		}
	}
}
