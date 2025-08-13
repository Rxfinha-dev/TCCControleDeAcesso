namespace TCCControleDeAcesso.Views
{
    partial class frmAtivacaoConta
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtAtivacao = new System.Windows.Forms.TextBox();
            this.lblConfirmacao = new System.Windows.Forms.Label();
            this.btnAtivacao = new System.Windows.Forms.Button();
            this.textBox1 = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // txtAtivacao
            // 
            this.txtAtivacao.Location = new System.Drawing.Point(142, 173);
            this.txtAtivacao.Name = "txtAtivacao";
            this.txtAtivacao.Size = new System.Drawing.Size(209, 20);
            this.txtAtivacao.TabIndex = 9;
            // 
            // lblConfirmacao
            // 
            this.lblConfirmacao.AutoSize = true;
            this.lblConfirmacao.Font = new System.Drawing.Font("Arial", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConfirmacao.Location = new System.Drawing.Point(13, 153);
            this.lblConfirmacao.Name = "lblConfirmacao";
            this.lblConfirmacao.Size = new System.Drawing.Size(467, 17);
            this.lblConfirmacao.TabIndex = 8;
            this.lblConfirmacao.Text = "Insira aqui a senha que enviamos no seu email para ativação da conta:";
            // 
            // btnAtivacao
            // 
            this.btnAtivacao.Location = new System.Drawing.Point(209, 199);
            this.btnAtivacao.Name = "btnAtivacao";
            this.btnAtivacao.Size = new System.Drawing.Size(75, 25);
            this.btnAtivacao.TabIndex = 12;
            this.btnAtivacao.Text = "Ativar Conta";
            this.btnAtivacao.UseVisualStyleBackColor = true;
            this.btnAtivacao.Click += new System.EventHandler(this.btnAtivacao_Click);
            // 
            // textBox1
            // 
            this.textBox1.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.textBox1.Location = new System.Drawing.Point(196, 230);
            this.textBox1.Name = "textBox1";
            this.textBox1.Size = new System.Drawing.Size(100, 13);
            this.textBox1.TabIndex = 13;
            this.textBox1.Visible = false;
            // 
            // frmAtivacaoConta
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(492, 396);
            this.Controls.Add(this.textBox1);
            this.Controls.Add(this.btnAtivacao);
            this.Controls.Add(this.txtAtivacao);
            this.Controls.Add(this.lblConfirmacao);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmAtivacaoConta";
            this.Text = "frmAtivacaoConta";
            this.Load += new System.EventHandler(this.frmAtivacaoConta_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.TextBox txtAtivacao;
        private System.Windows.Forms.Label lblConfirmacao;
        private System.Windows.Forms.Button btnAtivacao;
        private System.Windows.Forms.TextBox textBox1;
    }
}